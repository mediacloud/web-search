import json
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from mc_providers.exceptions import UnsupportedOperationException

from backend.users.models import Profile

from .helpers import quota_hits


class SearchJsonEndpointsTest(TestCase):
    """
    Happy-path coverage for the thin JSON passthrough endpoints
    (total_count, sample, count_over_time, languages, sources). Previously
    only their anonymous-rejection was tested; this also pins down the
    per-endpoint quota increment amount, which differs by endpoint and had
    never been checked.
    """

    def setUp(self):
        self.username = "json_endpoints_test_user"
        self.password = "correct-horse-battery-staple"
        # staff so query validation doesn't require real sources/collections
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

        self.query_params = {"q": "robots", "start": "2026-08-01", "end": "2026-09-01"}

    def test_total_count_happy_path_and_quota(self):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.count.side_effect = [10, 50]
            provider.everything_query.return_value = "*"
            mock_pq_provider.return_value = provider
            response = self.client.get("/api/search/total-count", self.query_params)

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["count"], {"relevant": 10, "total": 50})
        self.assertEqual(quota_hits(self.user), 1)

    def test_sample_happy_path_and_quota(self):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.sample.return_value = [{"id": 1, "title": "a story"}]
            mock_pq_provider.return_value = provider
            response = self.client.get("/api/search/sample", self.query_params)

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["sample"], [{"id": 1, "title": "a story"}])
        self.assertEqual(quota_hits(self.user), 1)

    def test_count_over_time_uses_normalized_counts_when_supported(self):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.normalized_count_over_time.return_value = {"counts": [{"date": "2026-08-01", "count": 3}]}
            mock_pq_provider.return_value = provider
            response = self.client.get("/api/search/count-over-time", self.query_params)

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["count_over_time"], {"counts": [{"date": "2026-08-01", "count": 3}]})
        provider.count_over_time.assert_not_called()
        self.assertEqual(quota_hits(self.user), 1)

    def test_count_over_time_falls_back_when_normalized_unsupported(self):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.normalized_count_over_time.side_effect = UnsupportedOperationException("nope")
            provider.count_over_time.return_value = {"counts": [{"date": "2026-08-01", "count": 3}]}
            mock_pq_provider.return_value = provider
            response = self.client.get("/api/search/count-over-time", self.query_params)

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["count_over_time"], {"counts": [{"date": "2026-08-01", "count": 3}]})
        self.assertEqual(quota_hits(self.user), 1)

    def test_languages_happy_path_and_quota(self):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.languages.return_value = [{"language": "en", "value": 5, "ratio": 1.0}]
            mock_pq_provider.return_value = provider
            response = self.client.get("/api/search/languages", self.query_params)

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["languages"], [{"language": "en", "value": 5, "ratio": 1.0}])
        self.assertEqual(quota_hits(self.user), 2)

    def test_sources_happy_path_and_quota(self):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.sources.return_value = [{"source": "example.com", "count": 10}]
            mock_pq_provider.return_value = provider
            response = self.client.get("/api/search/sources", self.query_params)

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["sources"], [{"source": "example.com", "count": 10}])
        # sources() passes a fixed limit of 10 as the 4th positional arg
        self.assertEqual(provider.sources.call_args.args[3], 10)
        self.assertEqual(quota_hits(self.user), 4)
