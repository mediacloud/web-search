import datetime as dt

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APITestCase

from ..models import ActionHistory, Feed, Source


class FeedsViewSetCrudTest(APITestCase):
    """
    FeedsViewSet CRUD had zero coverage beyond a single anonymous-list-401
    check. Unlike Collections/Sources, Feeds have no "contributor" write
    tier -- IsGetOrIsStaffOrContributor falls through to `False` for any
    non-staff write here, so only staff can create/update/delete.
    """

    URL = "/api/sources/feeds/"

    def setUp(self):
        self.source = Source.objects.create(
            name="example.com", homepage="http://example.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)
        self.feed = Feed.objects.create(
            source=self.source, url="http://example.com/feed.xml", name="Example Feed")

        self.staff_user = User.objects.create_user(
            username="feeds_staff", password="pw", is_staff=True)
        self.non_staff_user = User.objects.create_user(
            username="feeds_contributor", password="pw")

    def _response_ids(self, response):
        body = response.data
        results = body["results"] if isinstance(body, dict) and "results" in body else body
        return {row["id"] for row in results}

    def test_anonymous_list_and_retrieve_are_rejected(self):
        self.assertEqual(self.client.get(self.URL).status_code, 401)
        self.assertEqual(self.client.get(f"{self.URL}{self.feed.id}/").status_code, 401)

    def test_anonymous_create_update_delete_are_rejected(self):
        self.assertEqual(
            self.client.post(self.URL, {"url": "http://x.com/feed.xml", "source": self.source.id}, format="json").status_code,
            401)
        self.assertEqual(
            self.client.patch(f"{self.URL}{self.feed.id}/", {"name": "x"}, format="json").status_code, 401)
        self.assertEqual(self.client.delete(f"{self.URL}{self.feed.id}/").status_code, 401)

    def test_non_staff_can_read_but_not_write(self):
        self.client.force_login(self.non_staff_user)

        self.assertEqual(self.client.get(self.URL).status_code, 200)
        self.assertEqual(self.client.get(f"{self.URL}{self.feed.id}/").status_code, 200)

        self.assertEqual(
            self.client.post(
                self.URL, {"url": "http://new.example.com/feed.xml", "source": self.source.id},
                format="json").status_code,
            403)
        self.assertEqual(
            self.client.patch(f"{self.URL}{self.feed.id}/", {"name": "hacked"}, format="json").status_code,
            403)
        self.assertEqual(self.client.delete(f"{self.URL}{self.feed.id}/").status_code, 403)
        # confirm none of the rejected writes actually happened
        self.feed.refresh_from_db()
        self.assertEqual(self.feed.name, "Example Feed")

    def test_staff_can_create_update_delete_and_action_history_is_logged(self):
        self.client.force_login(self.staff_user)

        create_resp = self.client.post(self.URL, {
            "url": "http://new.example.com/feed.xml",
            "source": self.source.id,
            "name": "New Feed",
        }, format="json")
        self.assertEqual(create_resp.status_code, 201, create_resp.content)
        new_feed_id = create_resp.data["id"]
        self.assertTrue(Feed.objects.filter(pk=new_feed_id).exists())

        create_history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.FEED, object_id=new_feed_id, action_type="create").first()
        self.assertIsNotNone(create_history)
        self.assertEqual(create_history.object_name, "New Feed")
        self.assertEqual(create_history.user, self.staff_user)

        update_resp = self.client.patch(
            f"{self.URL}{new_feed_id}/", {"name": "Renamed Feed"}, format="json")
        self.assertEqual(update_resp.status_code, 200, update_resp.content)
        update_history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.FEED, object_id=new_feed_id, action_type="update").first()
        self.assertIsNotNone(update_history)
        self.assertIn("name", update_history.changes)

        delete_resp = self.client.delete(f"{self.URL}{new_feed_id}/")
        self.assertEqual(delete_resp.status_code, 204, delete_resp.content)
        self.assertFalse(Feed.objects.filter(pk=new_feed_id).exists())
        delete_history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.FEED, object_id=new_feed_id, action_type="delete").first()
        self.assertIsNotNone(delete_history)

    def test_source_id_filter(self):
        other_source = Source.objects.create(
            name="other.com", homepage="http://other.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)
        other_feed = Feed.objects.create(source=other_source, url="http://other.com/feed.xml")

        self.client.force_login(self.non_staff_user)
        response = self.client.get(self.URL, {"source_id": self.source.id})

        self.assertEqual(response.status_code, 200)
        ids = self._response_ids(response)
        self.assertEqual(ids, {self.feed.id})
        self.assertNotIn(other_feed.id, ids)

    def test_modified_since_and_modified_before_filters(self):
        now = timezone.now()
        old_feed = Feed.objects.create(source=self.source, url="http://example.com/old.xml")
        Feed.objects.filter(pk=old_feed.pk).update(modified_at=now - dt.timedelta(days=10))
        recent_feed = Feed.objects.create(source=self.source, url="http://example.com/recent.xml")
        Feed.objects.filter(pk=recent_feed.pk).update(modified_at=now - dt.timedelta(hours=1))

        self.client.force_login(self.non_staff_user)
        cutoff = (now - dt.timedelta(days=1)).timestamp()

        since_response = self.client.get(self.URL, {"modified_since": cutoff})
        self.assertEqual(since_response.status_code, 200)
        since_ids = self._response_ids(since_response)
        self.assertIn(recent_feed.id, since_ids)
        self.assertNotIn(old_feed.id, since_ids)

        before_response = self.client.get(self.URL, {"modified_before": cutoff})
        self.assertEqual(before_response.status_code, 200)
        before_ids = self._response_ids(before_response)
        self.assertIn(old_feed.id, before_ids)
        self.assertNotIn(recent_feed.id, before_ids)
