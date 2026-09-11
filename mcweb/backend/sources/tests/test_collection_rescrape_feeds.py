from unittest.mock import patch

from django.contrib.auth.models import User
from guardian.shortcuts import assign_perm
from rest_framework.test import APITestCase

from ...users.models import Profile
from ..models import ActionHistory, Collection

URL = "/api/sources/collections/rescrape-collection/"


class CollectionRescrapeFeedsTest(APITestCase):
    """
    CollectionViewSet.rescrape_feeds mirrors SourcesViewSet's version, but
    with two real differences worth pinning down: it looks the collection
    up via `self.queryset` directly rather than `get_queryset()`, so it
    bypasses the platform=ONLINE_NEWS filter that makes non-online-news
    collections invisible everywhere else in this viewset; and because
    it's a list-route POST with `collection_id` in the body, a contributor
    (not just staff) can reach it -- unlike Source's staff-only version.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="collection_rescrape_staff", password="pw", is_staff=True)
        # the sanity-check GET below goes through retrieve()'s quota check;
        # quota_mediacloud set explicitly so it doesn't fall back to
        # constance.config (which needs a live Redis connection)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.user)
        self.collection = Collection.objects.create(name="Rescrape Test Collection")

    @patch("backend.sources.api.schedule_scrape_collection")
    def test_schedules_scrape_and_logs_action_history(self, mock_schedule):
        mock_schedule.return_value = {"task": "queued"}

        response = self.client.post(URL, {"collection_id": self.collection.id}, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"task": "queued"})
        mock_schedule.assert_called_once_with(self.collection.id, self.user)

        history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.COLLECTION, object_id=self.collection.id,
            action_type="rescrape-feeds-scheduled").first()
        self.assertIsNotNone(history)

    @patch("backend.sources.api.schedule_scrape_collection")
    def test_reaches_non_online_news_collection_unlike_list_or_retrieve(self, mock_schedule):
        mock_schedule.return_value = {"task": "queued"}
        reddit_collection = Collection.objects.create(
            name="Reddit Collection", platform=Collection.CollectionPlatforms.REDDIT)

        # sanity check: this collection is invisible via the normal queryset
        self.assertEqual(self.client.get(f"/api/sources/collections/{reddit_collection.id}/").status_code, 404)

        response = self.client.post(URL, {"collection_id": reddit_collection.id}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        mock_schedule.assert_called_once_with(reddit_collection.id, self.user)

    def test_missing_collection_returns_404(self):
        response = self.client.post(URL, {"collection_id": 999999}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_anonymous_cannot_rescrape(self):
        self.client.logout()
        response = self.client.post(URL, {"collection_id": self.collection.id}, format="json")
        self.assertEqual(response.status_code, 401)


class CollectionRescrapeFeedsPermissionTest(APITestCase):
    """
    Unlike SourcesViewSet.rescrape_feeds (staff-only), this is a
    list-route POST with `collection_id` in the body, so a contributor's
    edit_collection grant on that specific collection is enough to reach it.
    """

    def setUp(self):
        self.collection = Collection.objects.create(name="Contributor Rescrape Collection")

    @patch("backend.sources.api.schedule_scrape_collection")
    def test_contributor_with_edit_collection_can_rescrape(self, mock_schedule):
        mock_schedule.return_value = {"task": "queued"}
        user = User.objects.create_user(username="collection_rescrape_contributor", password="pw")
        assign_perm("edit_collection", user, self.collection)
        self.client.force_login(user)

        response = self.client.post(URL, {"collection_id": self.collection.id}, format="json")

        self.assertEqual(response.status_code, 200, response.content)

    def test_non_staff_without_edit_collection_cannot_rescrape(self):
        user = User.objects.create_user(username="collection_rescrape_non_staff", password="pw")
        self.client.force_login(user)

        response = self.client.post(URL, {"collection_id": self.collection.id}, format="json")

        self.assertEqual(response.status_code, 403)
