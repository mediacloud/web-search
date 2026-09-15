import json
from unittest.mock import MagicMock, patch

import requests
from django.contrib.auth.models import User
from django.test import TestCase
from mc_providers.exceptions import ProviderException, TemporaryProviderException

from backend.users.exceptions import OverQuotaException
from backend.users.models import Profile
from util.exceptions import UserValueError


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
