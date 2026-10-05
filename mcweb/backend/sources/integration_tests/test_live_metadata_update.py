"""
Live integration test for the sources_metadata_update background task
(backend/sources/tasks.py -> backend/sources/metadata_update.py), which is
normally run periodically via `manage.py sources-meta-update` (see
supervisord.conf) to keep Source.stories_total/stories_per_week/last_story
(etc.) in sync with what's actually indexed in Elasticsearch.

Skipped unless RUN_INTEGRATION_TESTS=1 is set (CI never sets it, so this
never runs there). No mocking of mc_providers -- the "totals",
"stories_per_week", and "last_story" updaters each run a real aggregation
query against the real ES backend for a real, high-volume domain
(nytimes.com), and the results are asserted to be plausible rather than
mocked. Runs against the normal local/scratch Postgres test database.

    RUN_INTEGRATION_TESTS=1 python manage.py test backend.sources.integration_tests.test_live_metadata_update
"""
import datetime as dt

from django.contrib.auth.models import User
from django.test import TestCase

from backend.sources.models import Source
from backend.sources.tasks import sources_metadata_update
from backend.sources.task_utils import ChildSources
from backend.util.integration_test_utils import skip_unless_live_integration

SOURCE_ID = 1
DOMAIN = "nytimes.com"


@skip_unless_live_integration
class LiveMetadataUpdateTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="zzz_integration_test_meta", password="pw")
        self.source = Source.objects.create(
            id=SOURCE_ID, name=DOMAIN, homepage=f"https://{DOMAIN}",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

    def _options(self, *, task: list[str]) -> dict:
        return {
            "task": task,
            "user": self.user.username,
            "verbosity": 1,
            "platform_name": Source.SourcePlatforms.ONLINE_NEWS,
            "provider_name": "onlinenews-mediacloud",
            "provider_trace": 0,
            "rate": 100,
            "update": True,
            "process_child_sources": ChildSources.ALSO,
            "source_id": [str(SOURCE_ID)],
        }

    def test_totals_stories_per_week_and_last_story_against_real_es(self):
        options = self._options(task=["totals", "stories_per_week", "last_story"])
        sources_metadata_update.now(
            task_args={"long_task_name": "integration test sources-meta-update"},
            options=options,
        )

        self.source.refresh_from_db()

        # "totals": real all-time story counts for a high-volume domain
        self.assertIsNotNone(self.source.stories_total)
        self.assertGreater(self.source.stories_total, 0)
        self.assertIsNotNone(self.source.stories_date_past)
        self.assertIsNotNone(self.source.stories_date_future)
        self.assertIsNotNone(self.source.stories_date_empty)

        # "stories_per_week": real count for the last full week
        self.assertIsNotNone(self.source.stories_per_week)
        self.assertGreater(self.source.stories_per_week, 0)

        # "last_story": real max publication_date, should be recent
        self.assertIsNotNone(self.source.last_story)
        self.assertGreater(
            self.source.last_story.replace(tzinfo=None),
            dt.datetime.now() - dt.timedelta(days=60))
