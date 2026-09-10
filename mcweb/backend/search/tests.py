import datetime as dt
import json
from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

import requests
from django.contrib.auth.models import User
from django.test import TestCase
from mc_providers.exceptions import ProviderException, TemporaryProviderException

from backend.sources.models import Collection
from backend.users.exceptions import OverQuotaException
from backend.users.models import Profile
from util.exceptions import UserValueError


class LoginSearchDownloadCSVTest(TestCase):
    """
    Exercises the real user journey the four CSV-download endpoints exist
    for: log in, search a collection over a date range, download the CSV.
    Also guards the regression these endpoints previously had (no
    authentication enforced at all) by confirming anonymous requests are
    redirected to login.
    """

    DOWNLOAD_URLS = {
        "sources": "/api/search/download-top-sources-csv",
        "languages": "/api/search/download-top-languages-csv",
        "words": "/api/search/download-top-words-csv",
        "counts_over_time": "/api/search/download-counts-over-time-csv",
    }

    PROVIDER_NAME = "onlinenews-mediacloud"
    COLLECTION_ID = 34412234

    def setUp(self):
        self.username = "search_test_user"
        self.password = "correct-horse-battery-staple"
        self.user = User.objects.create_user(
            username=self.username, email="search_test_user@example.com",
            password=self.password)
        # quota_mediacloud set explicitly so the quota check doesn't fall
        # back to constance.config (which needs a live Redis connection)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)

        self.collection = Collection.objects.create(
            id=self.COLLECTION_ID,
            name="Robots Test Collection",
            platform=Collection.CollectionPlatforms.ONLINE_NEWS,
        )

        self.end_date = dt.date.today()
        self.start_date = self.end_date - dt.timedelta(days=30)  # "last month of data"
        query_state = [{
            "platform": self.PROVIDER_NAME,
            "query": "robots",
            "collections": [str(self.collection.id)],
            "sources": [],
            "startDate": self.start_date.strftime("%Y-%m-%d"),
            "endDate": self.end_date.strftime("%Y-%m-%d"),
        }]
        self.query_params = {"qS": json.dumps(query_state)}
        self.expected_start = dt.datetime.combine(self.start_date, dt.time.min)
        self.expected_end = dt.datetime.combine(self.end_date, dt.time.min)

    def _login(self):
        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": self.username, "password": self.password}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)

    def test_anonymous_download_requests_are_redirected_to_login(self):
        for name, url in self.DOWNLOAD_URLS.items():
            with self.subTest(endpoint=name):
                response = self.client.get(url, self.query_params)
                self.assertEqual(response.status_code, 302)
                parsed = urlparse(response.url)
                self.assertEqual(parsed.path, "/sign-in")
                # the frontend's sign-in page reads ?next= to send the user
                # back where they came from after logging in
                self.assertTrue(parse_qs(parsed.query)["next"][0].startswith(url))

    def test_anonymous_download_all_content_csv_is_redirected_to_login(self):
        response = self.client.get("/api/search/download-all-content-csv", self.query_params)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith("/sign-in"))

    def test_anonymous_send_email_large_download_csv_is_redirected_to_login(self):
        response = self.client.post(
            "/api/search/send-email-large-download-csv",
            data=json.dumps({"prepareQuery": [], "email": "someone@example.com"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith("/sign-in"))

    def test_anonymous_download_all_queries_csv_is_redirected_to_login(self):
        response = self.client.post("/api/search/download-all-queries", self.query_params)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith("/sign-in"))

    @patch("backend.search.views.pq_provider")
    def test_login_then_download_top_sources_csv(self, mock_pq_provider):
        provider = MagicMock()
        provider.sources.return_value = [{"source": "example.com", "count": 10}]
        mock_pq_provider.return_value = provider

        self._login()
        response = self.client.get(self.DOWNLOAD_URLS["sources"], self.query_params)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv")
        rows = response.content.decode().splitlines()
        self.assertEqual(rows[0], "source,count,ratio")
        self.assertEqual(rows[1], "example.com,10,1.0")

        query, start, end = provider.sources.call_args.args[:3]
        self.assertEqual(query, "robots")
        self.assertEqual(start, self.expected_start)
        self.assertEqual(end, self.expected_end)

    @patch("backend.search.views.pq_provider")
    def test_login_then_download_top_languages_csv(self, mock_pq_provider):
        provider = MagicMock()
        provider.languages.return_value = [{"language": "en", "value": 42, "ratio": 1.0}]
        mock_pq_provider.return_value = provider

        self._login()
        response = self.client.get(self.DOWNLOAD_URLS["languages"], self.query_params)

        self.assertEqual(response.status_code, 200)
        rows = response.content.decode().splitlines()
        # NOTE: the view's CSV header label is "count", even though the
        # provider data field it pulls from is named "value" (existing
        # naming quirk in CSVWriterHelper.write_top_langs, not a test bug)
        self.assertEqual(rows[0], "language,count,ratio")
        self.assertEqual(rows[1], "en,42,1.0")
        self.assertEqual(provider.languages.call_args.args[0], "robots")

    @patch("backend.search.views.pq_provider")
    def test_login_then_download_top_words_csv(self, mock_pq_provider):
        provider = MagicMock()
        provider.words.return_value = [{
            "term": "robots", "term_count": 5, "term_ratio": 0.5,
            "doc_count": 3, "doc_ratio": 0.3, "sample_size": 1000,
        }]
        mock_pq_provider.return_value = provider

        self._login()
        response = self.client.get(self.DOWNLOAD_URLS["words"], self.query_params)

        self.assertEqual(response.status_code, 200)
        rows = response.content.decode().splitlines()
        self.assertEqual(rows[0], "term,term_count,term_ratio,doc_count,doc_ratio,sample_size")
        self.assertEqual(rows[1], "robots,5,0.5,3,0.3,1000")
        self.assertEqual(provider.words.call_args.args[0], "robots")

    @patch("backend.search.views.pq_provider")
    def test_login_then_download_counts_over_time_csv(self, mock_pq_provider):
        provider = MagicMock()
        provider.normalized_count_over_time.return_value = {
            "counts": [{"date": "2026-08-10", "count": 3, "total_count": 30, "ratio": 0.1}],
        }
        mock_pq_provider.return_value = provider

        self._login()
        response = self.client.get(self.DOWNLOAD_URLS["counts_over_time"], self.query_params)

        self.assertEqual(response.status_code, 200)
        rows = response.content.decode().splitlines()
        self.assertEqual(rows[0], "date,count,total_count,ratio")
        self.assertEqual(rows[1], "2026-08-10,3,30,0.1")
        self.assertEqual(provider.normalized_count_over_time.call_args.args[0], "robots")


class AnonymousAccessSearchApiTest(TestCase):
    """
    Every one of these endpoints is gated by DRF's IsAuthenticated permission
    (either explicitly via @permission_classes, or via the project-wide
    REST_FRAMEWORK DEFAULT_PERMISSION_CLASSES). None of them had a test
    confirming anonymous requests are actually rejected.
    """

    # endpoints reachable with a bare GET and no query params: DRF's
    # permission check runs before the view body, so these are rejected
    # before parse_query would ever complain about missing params.
    GET_URLS = [
        "/api/search/total-count",
        "/api/search/sample",
        "/api/search/words",
        "/api/search/count-over-time",
        "/api/search/count-by-source-over-interval",
        "/api/search/story",
        "/api/search/languages",
        "/api/search/sources",
        "/api/search/story-list",
        "/api/search/providers",
        "/api/search/requests",
    ]

    def test_anonymous_requests_are_rejected(self):
        for url in self.GET_URLS:
            with self.subTest(endpoint=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 401)


class ProviderErrorHandlingTest(TestCase):
    """
    handle_provider_errors (search/views.py) is the shared decorator behind
    nearly every JSON search endpoint, and maps six different exception
    categories to six different response shapes/status codes. None of those
    mappings had a test. Exercised here via total_count, since it's the
    simplest view wrapped by the decorator.
    """

    def setUp(self):
        self.username = "provider_error_test_user"
        self.password = "correct-horse-battery-staple"
        # staff so query validation doesn't require real sources/collections
        self.user = User.objects.create_user(
            username=self.username, email="provider_error_test_user@example.com",
            password=self.password, is_staff=True)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)

        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": self.username, "password": self.password}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)

        self.query_params = {
            "q": "robots",
            "start": "2026-08-01",
            "end": "2026-09-01",
        }

    def _get_with_provider_raising(self, exc):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.count.side_effect = exc
            mock_pq_provider.return_value = provider
            return self.client.get("/api/search/total-count", self.query_params)

    def test_temporary_provider_exception_returns_temporary_error(self):
        exc = TemporaryProviderException("upstream timed out")
        response = self._get_with_provider_raising(exc)
        self.assertEqual(response.status_code, 400)
        body = json.loads(response.content)
        self.assertEqual(body["status"], "error")
        self.assertTrue(body["temporary"])
        self.assertNotIn("traceback", body)

    def test_connection_error_returns_temporary_error(self):
        exc = requests.exceptions.ConnectionError("connection refused")
        response = self._get_with_provider_raising(exc)
        self.assertEqual(response.status_code, 400)
        body = json.loads(response.content)
        self.assertTrue(body["temporary"])

    def test_over_quota_exception_returns_expected_message(self):
        exc = OverQuotaException("onlinenews-mediacloud", 1000)
        response = self._get_with_provider_raising(exc)
        self.assertEqual(response.status_code, 400)
        body = json.loads(response.content)
        self.assertEqual(body["note"], str(exc))
        self.assertNotIn("temporary", body)
        self.assertNotIn("traceback", body)

    def test_runtime_error_returns_400_with_message(self):
        exc = RuntimeError("something internal broke")
        response = self._get_with_provider_raising(exc)
        self.assertEqual(response.status_code, 400)
        body = json.loads(response.content)
        self.assertEqual(body["note"], "something internal broke")

    def test_user_value_error_returns_422(self):
        exc = UserValueError("bad query syntax")
        response = self._get_with_provider_raising(exc)
        self.assertEqual(response.status_code, 422)
        body = json.loads(response.content)
        self.assertEqual(body["note"], "bad query syntax")

    def test_generic_provider_exception_includes_traceback(self):
        exc = ProviderException("mystery upstream failure")
        response = self._get_with_provider_raising(exc)
        self.assertEqual(response.status_code, 400)
        body = json.loads(response.content)
        self.assertEqual(body["note"], "mystery upstream failure")
        self.assertIn("traceback", body)

    def test_unhandled_exception_returns_400_with_traceback(self):
        exc = KeyError("totally unexpected")
        response = self._get_with_provider_raising(exc)
        self.assertEqual(response.status_code, 400)
        body = json.loads(response.content)
        self.assertIn("traceback", body)

