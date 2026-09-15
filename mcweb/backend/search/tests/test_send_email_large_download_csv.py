import json
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from mc_providers.exceptions import UnsupportedOperationException

from backend.users.models import Profile
from settings import ALL_URLS_CSV_EMAIL_MAX, ALL_URLS_CSV_EMAIL_MIN


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
