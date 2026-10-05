"""
Live-ES integration tests for the search endpoints.

Skipped unless RUN_INTEGRATION_TESTS=1 is set (CI never sets it, so these
never run there). No mc_providers mocking anywhere in this file -- every
request here does a real query against the real Elasticsearch backend
configured via ONLINE_NEWS_MEDIA_CLOUD_PROVIDER_BASE_URL.

Runs against the normal local/scratch Postgres test database, same as
any other Django test (no --keepdb / real-dev-DB trickery needed). The
collection/source scoping the search views do is implemented by mapping
a Postgres Collection to its member Sources' domains (see
backend/search/utils.py:_for_media_cloud) -- since a fresh test database
has no real collection data, setUp() creates a Collection with id
ROBOT_COLLECTION_ID and attaches a handful of real, high-volume news
domains to it, so the *ES* query these tests exercise is real (real
domains, real ES index), even though the Postgres row wiring it up is a
local fixture rather than production's actual collection membership.

    RUN_INTEGRATION_TESTS=1 python manage.py test backend.search.integration_tests
"""
import datetime as dt
import json

from django.contrib.auth.models import User
from django.test import TestCase

from backend.sources.models import Collection, Source
from backend.users.models import Profile
from backend.util.integration_test_utils import skip_unless_live_integration

ROBOT_COLLECTION_ID = 262985270
PROVIDER_NAME = "onlinenews-mediacloud"

# real, high-volume news domains almost certain to have "robot"/"Trump"/
# "congress"/"climate change" stories in the live ES index over any given
# month -- used to populate the fixture collection below.
FIXTURE_DOMAINS = ["nytimes.com", "washingtonpost.com", "apnews.com", "bbc.com", "cnn.com"]


@skip_unless_live_integration
class LiveSearchTest(TestCase):
    """
    Logs a real user in through the real login endpoint, then exercises
    the main story-search endpoints (everything except the CSV downloads,
    covered separately below) against the live backend.
    """

    def setUp(self):
        self.collection = Collection.objects.create(
            id=ROBOT_COLLECTION_ID,
            name="Integration Test Fixture Collection",
            platform=Collection.CollectionPlatforms.ONLINE_NEWS,
        )
        for domain in FIXTURE_DOMAINS:
            source = Source.objects.create(
                name=domain, homepage=f"https://{domain}",
                platform=Source.SourcePlatforms.ONLINE_NEWS)
            self.collection.source_set.add(source)

        self.username = "zzz_integration_test_user"
        self.password = "correct-horse-battery-staple-42"
        self.user, created = User.objects.get_or_create(
            username=self.username,
            defaults={"email": f"{self.username}@example.com"},
        )
        if created:
            self.user.set_password(self.password)
            self.user.save()
        Profile.objects.update_or_create(
            user=self.user,
            # quota_mediacloud set explicitly so the quota check doesn't
            # fall back to constance.config (which needs a live Redis
            # connection)
            defaults={"verified_email": True, "quota_mediacloud": 1000},
        )

        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": self.username, "password": self.password}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)

        self.end_date = dt.date.today()
        self.start_date = self.end_date - dt.timedelta(days=30)  # "last month"

    def _params(self, query: str) -> dict:
        return {
            "q": query,
            "p": PROVIDER_NAME,
            "cs": str(ROBOT_COLLECTION_ID),
            "start": self.start_date.strftime("%Y-%m-%d"),
            "end": self.end_date.strftime("%Y-%m-%d"),
        }

    def _query_state(self, query: str) -> list[dict]:
        return [{
            "platform": PROVIDER_NAME,
            "query": query,
            "collections": [str(ROBOT_COLLECTION_ID)],
            "sources": [],
            "startDate": self.start_date.strftime("%Y-%m-%d"),
            "endDate": self.end_date.strftime("%Y-%m-%d"),
        }]

    def test_robot_story_count_over_last_month(self):
        response = self.client.get("/api/search/total-count", self._params("robot*"))
        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertGreater(body["count"]["relevant"], 0)

    def test_main_endpoints_return_reasonable_results(self):
        """
        The non-CSV endpoints the frontend relies on for every search
        (word counts, sample stories, count over time, top sources/langs)
        should all succeed and return plausibly non-empty data for common
        queries against a month of real news.
        """
        queries = ["robot", "Trump", "congress", '"climate change"']
        for query in queries:
            params = self._params(query)
            with self.subTest(query=query, endpoint="total-count"):
                response = self.client.get("/api/search/total-count", params)
                self.assertEqual(response.status_code, 200, response.content)
                self.assertGreater(json.loads(response.content)["count"]["relevant"], 0)

            with self.subTest(query=query, endpoint="sample"):
                response = self.client.get("/api/search/sample", params)
                self.assertEqual(response.status_code, 200, response.content)
                self.assertTrue(len(json.loads(response.content)["sample"]) > 0)

            with self.subTest(query=query, endpoint="count-over-time"):
                response = self.client.get("/api/search/count-over-time", params)
                self.assertEqual(response.status_code, 200, response.content)
                self.assertIn("counts", json.loads(response.content)["count_over_time"])

            with self.subTest(query=query, endpoint="words"):
                response = self.client.get("/api/search/words", params)
                self.assertEqual(response.status_code, 200, response.content)
                self.assertTrue(len(json.loads(response.content)["words"]) > 0)

            with self.subTest(query=query, endpoint="sources"):
                response = self.client.get("/api/search/sources", params)
                self.assertEqual(response.status_code, 200, response.content)
                self.assertTrue(len(json.loads(response.content)["sources"]) > 0)

            with self.subTest(query=query, endpoint="languages"):
                response = self.client.get("/api/search/languages", params)
                self.assertEqual(response.status_code, 200, response.content)
                self.assertTrue(len(json.loads(response.content)["languages"]) > 0)

    def test_download_all_content_csv_for_robot_query(self):
        response = self.client.get(
            "/api/search/download-all-content-csv",
            {"qS": json.dumps(self._query_state("robot*"))},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        rows = b"".join(response.streaming_content).decode().splitlines()
        # header row plus at least one story row
        self.assertGreater(len(rows), 1)
