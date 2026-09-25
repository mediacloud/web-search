import json
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token

from backend.users.models import Profile

from .helpers import quota_hits

"""
total_count/count_over_time/count_by_source_over_interval are decorated
with @authentication_classes([TokenAuthentication, SessionAuthentication]),
but every existing test for them only exercised the session-login path.
This confirms the token-header path works too, since it's the one actual
API clients (as opposed to the web UI) use.
"""


def _token_header(user):
    token = Token.objects.get(user=user)
    return {"HTTP_AUTHORIZATION": f"Token {token.key}"}


class TotalCountTokenAuthTest(TestCase):
    URL = "/api/search/total-count"

    def setUp(self):
        self.user = User.objects.create_user(
            username="total_count_token_user", email="total_count_token_user@example.com", is_staff=True)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)

    def test_token_authenticated_request_succeeds(self):
        with patch("backend.search.views.pq_provider") as mock_pq_provider:
            provider = MagicMock()
            provider.count.side_effect = [10, 50]
            provider.everything_query.return_value = "*"
            mock_pq_provider.return_value = provider
            response = self.client.get(
                self.URL, {"q": "robots", "start": "2026-08-01", "end": "2026-09-01"},
                **_token_header(self.user))

        self.assertEqual(response.status_code, 200, response.content)
        body = json.loads(response.content)
        self.assertEqual(body["count"], {"relevant": 10, "total": 50})
        self.assertEqual(quota_hits(self.user), 1)

    def test_invalid_token_is_rejected(self):
        response = self.client.get(
            self.URL, {"q": "robots", "start": "2026-08-01", "end": "2026-09-01"},
            HTTP_AUTHORIZATION="Token does-not-exist")

        self.assertEqual(response.status_code, 401)
