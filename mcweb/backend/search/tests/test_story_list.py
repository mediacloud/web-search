import json
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token

from backend.sources.models import Source
from backend.users.models import Profile

from .helpers import quota_hits


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
        self.assertEqual(quota_hits(user), 1)

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
