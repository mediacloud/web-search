import datetime as dt
import json
from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

import requests
from django.contrib.auth.models import User
from django.test import TestCase
from mc_providers.exceptions import (
    ProviderException, TemporaryProviderException, UnsupportedOperationException)
from rest_framework.authtoken.models import Token

from backend.sources.models import Collection, Source
from backend.users.exceptions import OverQuotaException
from backend.users.models import Profile, QuotaHistory
from settings import ALL_URLS_CSV_EMAIL_MAX, ALL_URLS_CSV_EMAIL_MIN
from util.exceptions import UserValueError

from .utils import _get_parse_date, _validate_sources_or_collections, parsed_query_from_dict


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


class StoryDetailTest(TestCase):
    """
    story_detail (used by the frontend's StoryShow.jsx via getStoryDetails)
    strips the full story text for non-staff users -- untested before, and
    exactly the kind of authorization branch worth pinning down.
    """

    def _make_user(self, username, is_staff):
        user = User.objects.create_user(
            username=username, email=f"{username}@example.com",
            password="correct-horse-battery-staple", is_staff=is_staff)
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)
        return user

    def _login_as(self, user):
        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": user.username, "password": "correct-horse-battery-staple"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)

    @patch("backend.search.views.pq_provider")
    def test_staff_user_sees_full_story_text(self, mock_pq_provider):
        provider = MagicMock()
        provider.item.return_value = {"title": "headline", "text": "the full article body"}
        mock_pq_provider.return_value = provider

        self._login_as(self._make_user("story_detail_staff", is_staff=True))
        response = self.client.get(
            "/api/search/story", {"storyId": "story-123", "platform": "onlinenews-mediacloud"})

        self.assertEqual(response.status_code, 200)
        story = json.loads(response.content)["story"]
        self.assertEqual(story["text"], "the full article body")

    @patch("backend.search.views.pq_provider")
    def test_non_staff_user_does_not_see_story_text(self, mock_pq_provider):
        provider = MagicMock()
        provider.item.return_value = {"title": "headline", "text": "the full article body"}
        mock_pq_provider.return_value = provider

        self._login_as(self._make_user("story_detail_non_staff", is_staff=False))
        response = self.client.get(
            "/api/search/story", {"storyId": "story-123", "platform": "onlinenews-mediacloud"})

        self.assertEqual(response.status_code, 200)
        story = json.loads(response.content)["story"]
        self.assertNotIn("text", story)
        self.assertEqual(story["title"], "headline")


class SendEmailLargeDownloadCsvTest(TestCase):
    """
    send-email-large-download-csv (used by TotalAttentionEmailModal.jsx) only
    triggers the email task when the summed count across all queries falls
    within [ALL_URLS_CSV_EMAIL_MIN, ALL_URLS_CSV_EMAIL_MAX]. Neither boundary,
    nor the "provider can't count" escape hatch, had a test.
    """

    URL = "/api/search/send-email-large-download-csv"

    def setUp(self):
        self.username = "email_download_test_user"
        self.password = "correct-horse-battery-staple"
        self.user = User.objects.create_user(
            username=self.username, email=f"{self.username}@example.com",
            password=self.password)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)

        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": self.username, "password": self.password}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)

        self.query_state = [{
            "platform": "onlinenews-mediacloud",
            "query": "robots",
            "collections": [],
            "sources": [],
            "startDate": "2026-08-01",
            "endDate": "2026-09-01",
        }]

    def _post(self, total, email="someone@example.com"):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.count.return_value = total
            mock_pq_provider.return_value = provider
            return self.client.post(
                self.URL,
                data=json.dumps({"prepareQuery": self.query_state, "email": email}),
                content_type="application/json",
            )

    @patch("backend.search.views.download_all_large_content_csv")
    def test_total_below_minimum_is_rejected(self, mock_download_task):
        response = self._post(total=ALL_URLS_CSV_EMAIL_MIN - 1)
        self.assertEqual(response.status_code, 400)
        body = json.loads(response.content)
        self.assertIn("not between", body["note"])
        mock_download_task.assert_not_called()

    @patch("backend.search.views.download_all_large_content_csv")
    def test_total_above_maximum_is_rejected(self, mock_download_task):
        response = self._post(total=ALL_URLS_CSV_EMAIL_MAX + 1)
        self.assertEqual(response.status_code, 400)
        mock_download_task.assert_not_called()

    @patch("backend.search.views.download_all_large_content_csv")
    def test_total_within_range_triggers_email_task(self, mock_download_task):
        mock_download_task.return_value = {"task": "queued"}
        total = (ALL_URLS_CSV_EMAIL_MIN + ALL_URLS_CSV_EMAIL_MAX) // 2

        response = self._post(total=total, email="reporter@example.com")

        self.assertEqual(response.status_code, 200, response.content)
        mock_download_task.assert_called_once()
        args = mock_download_task.call_args.args
        self.assertEqual(args[0], self.query_state)
        self.assertEqual(args[1], self.user.id)
        self.assertEqual(args[3], "reporter@example.com")

    @patch("backend.search.views.download_all_large_content_csv")
    def test_provider_that_cannot_count_is_reported_cleanly(self, mock_download_task):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.count.side_effect = UnsupportedOperationException("no counting here")
            mock_pq_provider.return_value = provider
            response = self.client.post(
                self.URL,
                data=json.dumps({"prepareQuery": self.query_state, "email": "someone@example.com"}),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 400)
        body = json.loads(response.content)
        self.assertIn("Can't count results", body["note"])
        mock_download_task.assert_not_called()


class GetParseDateTest(TestCase):
    """
    _get_parse_date backs every date-range param on every search endpoint
    (via parse_query_params/parsed_query_from_dict) -- it accepts two
    different date formats depending on caller, and had no direct test.
    """

    def test_accepts_iso_format(self):
        self.assertEqual(
            _get_parse_date({"start": "2026-08-01"}, "start"),
            dt.datetime(2026, 8, 1))

    def test_accepts_us_slash_format(self):
        self.assertEqual(
            _get_parse_date({"start": "08/01/2026"}, "start"),
            dt.datetime(2026, 8, 1))

    def test_missing_value_raises_user_value_error(self):
        with self.assertRaises(UserValueError):
            _get_parse_date({}, "start")

    def test_blank_value_raises_user_value_error(self):
        with self.assertRaises(UserValueError):
            _get_parse_date({"start": ""}, "start")

    def test_malformed_value_raises_user_value_error(self):
        with self.assertRaises(UserValueError):
            _get_parse_date({"start": "not-a-date"}, "start")

    def test_wrong_separator_for_format_raises_user_value_error(self):
        # has a "-" so it's parsed as ISO, but isn't valid ISO -> should
        # still be a clean UserValueError, not an uncaught ValueError
        with self.assertRaises(UserValueError):
            _get_parse_date({"start": "2026/08-01"}, "start")


class ValidateSourcesOrCollectionsTest(TestCase):
    """
    _validate_sources_or_collections backs the media-cloud query-scoping
    validation in utils._for_media_cloud -- untested directly before.
    """

    def setUp(self):
        self.source = Source.objects.create(
            name="testsource.com", homepage="http://testsource.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

    def test_all_valid_ids_does_not_raise(self):
        _validate_sources_or_collections(
            [str(self.source.id)], Source, Source.SourcePlatforms.ONLINE_NEWS)

    def test_unknown_id_raises_user_value_error_naming_it(self):
        bogus_id = self.source.id + 1000
        with self.assertRaises(UserValueError) as ctx:
            _validate_sources_or_collections(
                [str(self.source.id), str(bogus_id)], Source, Source.SourcePlatforms.ONLINE_NEWS)
        self.assertIn(str(bogus_id), str(ctx.exception))

    def test_id_for_wrong_platform_is_treated_as_invalid(self):
        other_platform_source = Source.objects.create(
            name="other.com", homepage="http://other.com",
            platform=Source.SourcePlatforms.YOUTUBE)
        with self.assertRaises(UserValueError) as ctx:
            _validate_sources_or_collections(
                [str(other_platform_source.id)], Source, Source.SourcePlatforms.ONLINE_NEWS)
        self.assertIn(str(other_platform_source.id), str(ctx.exception))


class ParsedQueryFromDictTest(TestCase):
    """
    parsed_query_from_dict turns the frontend's queryState objects into
    ParsedQuery, and is shared by every download-*-csv endpoint plus
    send-email-large-download-csv and download-all-queries -- untested
    directly before (only exercised incidentally through the CSV tests'
    happy paths).
    """

    def test_missing_query_raises_user_value_error(self):
        payload = {
            "platform": "onlinenews-mediacloud", "query": "",
            "collections": [], "sources": [],
            "startDate": "2026-08-01", "endDate": "2026-09-01",
        }
        with self.assertRaises(UserValueError):
            parsed_query_from_dict(payload, session_id=None)

    def test_valid_payload_produces_expected_parsed_query(self):
        payload = {
            "platform": "onlinenews-mediacloud", "query": "robots",
            "collections": [], "sources": [],
            "startDate": "2026-08-01", "endDate": "2026-09-01",
        }
        pq = parsed_query_from_dict(payload, session_id="user@example.com")
        self.assertEqual(pq.provider_name, "onlinenews-mediacloud")
        self.assertEqual(pq.query_str, "robots")
        self.assertEqual(pq.start_date, dt.datetime(2026, 8, 1))
        self.assertEqual(pq.end_date, dt.datetime(2026, 9, 1))
        self.assertEqual(pq.session_id, "user@example.com")


def _quota_hits(user, provider="onlinenews-mediacloud"):
    row = QuotaHistory.objects.filter(user_id=user.id, provider=provider).first()
    return row.hits if row else 0


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
        self.assertEqual(_quota_hits(self.user), 1)

    def test_sample_happy_path_and_quota(self):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.sample.return_value = [{"id": 1, "title": "a story"}]
            mock_pq_provider.return_value = provider
            response = self.client.get("/api/search/sample", self.query_params)

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["sample"], [{"id": 1, "title": "a story"}])
        self.assertEqual(_quota_hits(self.user), 1)

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
        self.assertEqual(_quota_hits(self.user), 1)

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
        self.assertEqual(_quota_hits(self.user), 1)

    def test_languages_happy_path_and_quota(self):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.languages.return_value = [{"language": "en", "value": 5, "ratio": 1.0}]
            mock_pq_provider.return_value = provider
            response = self.client.get("/api/search/languages", self.query_params)

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["languages"], [{"language": "en", "value": 5, "ratio": 1.0}])
        self.assertEqual(_quota_hits(self.user), 2)

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
        self.assertEqual(_quota_hits(self.user), 4)


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
        self.assertEqual(_quota_hits(self.user), 4)

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


class StoryListTest(TestCase):
    """
    story_list (search/urls.py:25) gates the 'expanded' (full-text) and
    'randomize' query params behind staff-only access -- neither branch had
    a test. Note: this endpoint only accepts TokenAuthentication (not
    session), so tests authenticate via an Authorization header.
    """

    URL = "/api/search/story-list"

    def _make_user(self, username, is_staff):
        user = User.objects.create_user(
            username=username, email=f"{username}@example.com",
            password="correct-horse-battery-staple", is_staff=is_staff)
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)
        return user

    def _token_header(self, user):
        token = Token.objects.get(user=user)
        return {"HTTP_AUTHORIZATION": f"Token {token.key}"}

    def _mock_provider(self):
        provider = MagicMock()
        provider.paged_items.return_value = ([{"id": 1}], "next-page-token")
        return provider

    def test_happy_path_and_quota(self):
        user = self._make_user("story_list_staff", is_staff=True)
        provider = self._mock_provider()
        with patch("backend.search.views.pq_provider", return_value=provider):
            response = self.client.get(
                self.URL, {"q": "robots", "start": "2026-08-01", "end": "2026-09-01"},
                **self._token_header(user))

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["stories"], [{"id": 1}])
        self.assertEqual(body["pagination_token"], "next-page-token")
        self.assertEqual(_quota_hits(user), 1)

    def test_non_staff_cannot_request_expanded_stories(self):
        user = self._make_user("story_list_non_staff_expanded", is_staff=False)
        source = Source.objects.create(
            name="example.com", homepage="http://example.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)
        provider = self._mock_provider()
        with patch("backend.search.views.pq_provider", return_value=provider):
            response = self.client.get(
                self.URL,
                {"q": "robots", "ss": str(source.id), "start": "2026-08-01", "end": "2026-09-01", "expanded": "1"},
                **self._token_header(user))

        self.assertEqual(response.status_code, 403)
        self.assertIn("expanded", json.loads(response.content)["note"])
        provider.paged_items.assert_not_called()

    def test_staff_can_request_expanded_stories(self):
        user = self._make_user("story_list_staff_expanded", is_staff=True)
        provider = self._mock_provider()
        with patch("backend.search.views.pq_provider", return_value=provider):
            response = self.client.get(
                self.URL,
                {"q": "robots", "start": "2026-08-01", "end": "2026-09-01", "expanded": "1"},
                **self._token_header(user))

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(provider.paged_items.call_args.kwargs["expanded"], True)

    def test_non_staff_cannot_request_randomized_stories(self):
        user = self._make_user("story_list_non_staff_random", is_staff=False)
        source = Source.objects.create(
            name="random.com", homepage="http://random.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)
        provider = self._mock_provider()
        with patch("backend.search.views.pq_provider", return_value=provider):
            response = self.client.get(
                self.URL,
                {"q": "robots", "ss": str(source.id), "start": "2026-08-01", "end": "2026-09-01", "randomize": "1"},
                **self._token_header(user))

        self.assertEqual(response.status_code, 403)
        self.assertIn("randomized", json.loads(response.content)["note"])
        provider.paged_items.assert_not_called()

    def test_staff_can_request_randomized_stories(self):
        user = self._make_user("story_list_staff_random", is_staff=True)
        provider = self._mock_provider()
        with patch("backend.search.views.pq_provider", return_value=provider):
            response = self.client.get(
                self.URL,
                {"q": "robots", "start": "2026-08-01", "end": "2026-09-01", "randomize": "1"},
                **self._token_header(user))

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(provider.paged_items.call_args.kwargs["randomize"], True)

