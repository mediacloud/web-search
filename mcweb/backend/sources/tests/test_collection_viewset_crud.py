from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ...users.models import Profile, QuotaHistory
from ..models import ActionHistory, Collection, Source

URL = "/api/sources/collections/"


class CollectionViewSetCrudTest(APITestCase):
    """
    CollectionViewSet has no create/update/destroy overrides -- it relies
    entirely on DRF's ModelViewSet defaults plus ActionHistoryViewSetMixin
    (same shape as FeedsViewSet). None of that, nor the retrieve() quota
    check, nor the name-uniqueness constraint, had a test.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="collection_crud_staff", password="pw", is_staff=True)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.user)

    def test_create_logs_action_history(self):
        response = self.client.post(URL, {"name": "New Collection", "notes": "hi"}, format="json")

        self.assertEqual(response.status_code, 201, response.content)
        collection_id = response.data["id"]
        self.assertTrue(Collection.objects.filter(pk=collection_id, name="New Collection").exists())

        history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.COLLECTION, object_id=collection_id, action_type="create").first()
        self.assertIsNotNone(history)
        self.assertEqual(history.object_name, "New Collection")

    def test_duplicate_name_is_rejected(self):
        Collection.objects.create(name="Existing Collection")

        response = self.client.post(URL, {"name": "Existing Collection"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)
        self.assertEqual(Collection.objects.filter(name="Existing Collection").count(), 1)

    def test_update_logs_action_history_with_changed_fields(self):
        collection = Collection.objects.create(name="Original Name")

        response = self.client.patch(f"{URL}{collection.id}/", {"notes": "new notes"}, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        collection.refresh_from_db()
        self.assertEqual(collection.notes, "new notes")

        history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.COLLECTION, object_id=collection.id, action_type="update").first()
        self.assertIsNotNone(history)
        self.assertIn("notes", history.changes)

    def test_destroy_logs_action_history(self):
        collection = Collection.objects.create(name="Deletable")

        response = self.client.delete(f"{URL}{collection.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Collection.objects.filter(pk=collection.id).exists())

        history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.COLLECTION, object_id=collection.id, action_type="delete").first()
        self.assertIsNotNone(history)

    def test_retrieve_increments_quota(self):
        collection = Collection.objects.create(name="Quota Test Collection")

        response = self.client.get(f"{URL}{collection.id}/")

        self.assertEqual(response.status_code, 200, response.content)
        hits = QuotaHistory.objects.get(user=self.user, provider="onlinenews-mediacloud").hits
        self.assertEqual(hits, 1)

    def test_source_count_reflects_membership(self):
        collection = Collection.objects.create(name="Counted Collection")
        source = Source.objects.create(name="example.com", homepage="http://example.com")

        response = self.client.get(f"{URL}{collection.id}/")
        self.assertEqual(response.data["source_count"], 0)

        collection.source_set.add(source)

        response = self.client.get(f"{URL}{collection.id}/")
        self.assertEqual(response.data["source_count"], 1)

        collection.source_set.remove(source)

        response = self.client.get(f"{URL}{collection.id}/")
        self.assertEqual(response.data["source_count"], 0)
