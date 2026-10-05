"""
Live integration test for source creation + RSS feed discovery
("rescrape").

Skipped unless RUN_INTEGRATION_TESTS=1 is set (CI never sets it, so this
never runs there). Runs against the normal local/scratch Postgres test
database (rolled back afterwards like any other Django test, plus an
explicit delete in setUp/tearDown -- see below), but hits the real
internet: feed discovery fetches the live homepage
http://dataculture.northeastern.edu and follows its real links/sitemaps.
Run with:

    RUN_INTEGRATION_TESTS=1 python manage.py test backend.sources.integration_tests

setUp explicitly deletes any pre-existing Source for this domain (and its
Feeds, via CASCADE) before the test runs, so this always exercises the
real *create* path (never the update branch) and starts from a known
empty-feeds state; tearDown deletes it again afterwards. This is
belt-and-suspenders on top of TestCase's normal transaction rollback --
harmless if nothing existed, but keeps this test deterministic and leaves
nothing behind even if ever run outside a rolled-back transaction (e.g.
against a persistent/--keepdb database).

There's no background_task worker process running during `manage.py
test`, so rather than schedule a Task via the rescrape-feeds action and
poll forever for a worker that will never pick it up, this calls
tasks.scrape_source.now(...) directly afterwards with the same kwargs
schedule_scrape_source (backend/sources/tasks.py) would have queued --
the same "run in the foreground" path `manage.py scrape-source` (without
--queue) already uses, see util/tasks.py TaskCommand.run_task.
"""
from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from backend.sources.models import Feed, Source
from backend.sources.tasks import scrape_source
from backend.util.integration_test_utils import skip_unless_live_integration

HOMEPAGE = "http://dataculture.northeastern.edu"
# mcmetadata.urls.canonical_domain() collapses .edu/.gov subdomains to
# their institutional base domain, so Source.name ends up "northeastern.edu"
# rather than the literal "dataculture.northeastern.edu" homepage -- this is
# used for all Source lookups/deletes below, not the homepage itself.
CANONICAL_DOMAIN = "northeastern.edu"


@skip_unless_live_integration
class LiveSourceRescrapeTest(APITestCase):

    def setUp(self):
        # Feed rows cascade-delete with their Source (models.py:
        # Feed.source on_delete=CASCADE).
        Source.objects.filter(name=CANONICAL_DOMAIN, platform=Source.SourcePlatforms.ONLINE_NEWS).delete()

        self.user, created = User.objects.get_or_create(
            username="zzz_integration_test_admin",
            defaults={"email": "zzz_integration_test_admin@example.com", "is_staff": True},
        )
        if not self.user.is_staff:
            self.user.is_staff = True
            self.user.save()
        self.client.force_login(self.user)

    def tearDown(self):
        Source.objects.filter(name=CANONICAL_DOMAIN, platform=Source.SourcePlatforms.ONLINE_NEWS).delete()

    def test_create_source_and_rescrape_finds_feeds(self):
        self.assertFalse(
            Source.objects.filter(name=CANONICAL_DOMAIN, platform=Source.SourcePlatforms.ONLINE_NEWS).exists())

        response = self.client.post(
            "/api/sources/sources/", {"homepage": HOMEPAGE}, format="json")
        self.assertEqual(response.status_code, 200, response.content)

        source = Source.objects.get(id=response.data["source"]["id"])
        self.assertEqual(source.homepage, HOMEPAGE)
        self.assertEqual(source.name, CANONICAL_DOMAIN)
        self.assertEqual(source.platform, Source.SourcePlatforms.ONLINE_NEWS)
        self.assertEqual(Feed.objects.filter(source_id=source.id).count(), 0)

        # exercises the real scheduling wiring end-to-end (view -> action
        # history -> schedule_scrape_source), even though nothing will
        # ever consume the resulting Task in this test process.
        response = self.client.post(
            "/api/sources/sources/rescrape-feeds/", {"source_id": source.id}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertIn("task", response.data)

        # actually run the feed discovery, synchronously, in this process
        scrape_source.now(
            source_id=source.id,
            homepage=source.homepage,
            name=source.name,
            email=self.user.email,
            options={"user": self.user.username},
            task_args={"long_task_name": f"integration test rescrape source {source.id}"},
        )

        feeds = list(Feed.objects.filter(source_id=source.id))
        self.assertGreater(len(feeds), 0, "expected rescrape to add at least one feed")

        source.refresh_from_db()
        self.assertIsNotNone(source.last_rescraped)
