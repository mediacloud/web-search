import json
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.test import TestCase

from backend.users.models import Profile


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
