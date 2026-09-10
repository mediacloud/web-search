import json
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase

from backend.sources.models import Source
from backend.users.models import Profile

from .helpers import quota_hits


class CountBySourceOverIntervalTest(TestCase):
    """
    count_by_source_over_interval (search/urls.py:15) has substantial
    hand-written branching -- interval validation, a required-domains
    check, a date-range sanity check, per-interval bucket-count arithmetic
    for day/week/month/year, and a bucket-overflow guard -- none of it
    previously tested.
    """

    URL = "/api/search/count-by-source-over-interval"

    def setUp(self):
        self.username = "interval_test_user"
        self.password = "correct-horse-battery-staple"
        self.user = User.objects.create_user(
            username=self.username, email=f"{self.username}@example.com",
            password=self.password, is_staff=True)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)

        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": self.username, "password": self.password}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)

        # a real Source (no url_search_string) so _for_media_cloud populates
        # provider_props["domains"], which the view requires to be non-empty
        self.source = Source.objects.create(
            name="example.com", homepage="http://example.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

    def _get(self, provider=None, **params):
        query_params = {
            "q": "robots", "ss": str(self.source.id),
            "start": "2026-08-01", "end": "2026-08-05",
            **params,
        }
        if provider is None:
            provider = MagicMock()
            provider.MAX_2D_AGG_BUCKETS = 100000
            provider.two_d_aggregation.return_value = {"buckets": {}}
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            mock_pq_provider.return_value = provider
            return self.client.get(self.URL, query_params), provider

    def test_invalid_interval_is_rejected(self):
        response, _ = self._get(interval="fortnight")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid interval", json.loads(response.content)["note"])

    def test_missing_domains_is_rejected(self):
        provider = MagicMock()
        provider.MAX_2D_AGG_BUCKETS = 100000
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            mock_pq_provider.return_value = provider
            response = self.client.get(self.URL, {
                "q": "robots", "start": "2026-08-01", "end": "2026-08-05",
            })
        self.assertEqual(response.status_code, 400)
        self.assertIn("No domains selected", json.loads(response.content)["note"])

    def test_invalid_date_range_is_rejected(self):
        response, _ = self._get(start="2026-08-05", end="2026-08-01")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid date range", json.loads(response.content)["note"])

    def test_too_many_buckets_is_rejected(self):
        provider = MagicMock()
        provider.MAX_2D_AGG_BUCKETS = 1  # 5-day span, 1 domain, interval=day -> 5 buckets > 1
        response, _ = self._get(provider=provider, interval="day")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Too many sources", json.loads(response.content)["note"])

    def test_day_interval_bucket_count(self):
        # 2026-08-01 through 2026-08-05 inclusive = 5 days
        response, provider = self._get(interval="day")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(provider.two_d_aggregation.call_args_list[0].kwargs["num_intervals"], 5)

    def test_week_interval_bucket_count(self):
        # 2026-08-01 through 2026-08-14 inclusive = 14 days -> ceil(14/7) = 2
        response, provider = self._get(interval="week", start="2026-08-01", end="2026-08-14")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(provider.two_d_aggregation.call_args_list[0].kwargs["num_intervals"], 2)

    def test_month_interval_bucket_count(self):
        # Jan 15 through Mar 10 spans 3 distinct calendar months
        response, provider = self._get(interval="month", start="2026-01-15", end="2026-03-10")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(provider.two_d_aggregation.call_args_list[0].kwargs["num_intervals"], 3)

    def test_year_interval_bucket_count(self):
        # 2024 through 2026 spans 3 distinct calendar years
        response, provider = self._get(interval="year", start="2024-06-01", end="2026-01-10")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(provider.two_d_aggregation.call_args_list[0].kwargs["num_intervals"], 3)

    def test_happy_path_shapes_data_and_computes_ratio_and_quota(self):
        provider = MagicMock()
        provider.MAX_2D_AGG_BUCKETS = 100000
        matching = {"buckets": {"2026-08-01": {"example.com": 3}}}
        totals = {"buckets": {"2026-08-01": {"example.com": 10}}}
        provider.two_d_aggregation.side_effect = [matching, totals]

        response, _ = self._get(provider=provider, interval="day", start="2026-08-01", end="2026-08-01")

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["source-interval-attention"], [{
            "media_name": "example.com",
            "interval": "day",
            "bucket": "2026-08-01",
            "matching_stories": 3,
            "total_stories": 10,
            "ratio": 0.3,
        }])
        self.assertEqual(quota_hits(self.user), 4)

    def test_zero_total_stories_gives_zero_ratio_not_division_error(self):
        provider = MagicMock()
        provider.MAX_2D_AGG_BUCKETS = 100000
        matching = {"buckets": {"2026-08-01": {"example.com": 0}}}
        totals = {"buckets": {"2026-08-01": {"example.com": 0}}}
        provider.two_d_aggregation.side_effect = [matching, totals]

        response, _ = self._get(provider=provider, interval="day", start="2026-08-01", end="2026-08-01")

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["source-interval-attention"][0]["ratio"], 0)
