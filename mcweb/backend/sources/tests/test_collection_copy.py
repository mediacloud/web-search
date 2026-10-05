from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ..models import ActionHistory, Collection, Source

URL = "/api/sources/collections/copy-collection/"


class CopyCollectionTest(APITestCase):
    """
    copy_collection had no coverage: it only copies name+platform (not
    notes/public/featured/monitored), copies source membership, and has
    its own ad hoc error handling (catches everything, returns a 400 with
    an {"error": ...} body rather than raising).
    """

    def setUp(self):
        self.user = User.objects.create_user(username="copy_collection_staff", password="pw", is_staff=True)
        self.client.force_login(self.user)
        self.original = Collection.objects.create(
            name="Original Collection", notes="secret notes", public=False,
            featured=True, monitored=True, platform=Collection.CollectionPlatforms.REDDIT)
        self.source = Source.objects.create(name="example.com", homepage="http://example.com")
        self.original.source_set.add(self.source)

    def test_copies_only_name_and_platform_with_default_name(self):
        response = self.client.post(URL, {"collection_id": self.original.id}, format="json")

        self.assertEqual(response.status_code, 201, response.content)
        copy = Collection.objects.get(pk=response.data["id"])
        self.assertEqual(copy.name, "Original Collection (Copy)")
        self.assertEqual(copy.platform, Collection.CollectionPlatforms.REDDIT)
        # not copied -- copy_collection only builds {name, platform}
        self.assertIsNone(copy.notes)
        self.assertTrue(copy.public)
        self.assertFalse(copy.featured)
        self.assertFalse(copy.monitored)

    def test_copies_source_membership(self):
        response = self.client.post(URL, {"collection_id": self.original.id}, format="json")

        self.assertEqual(response.status_code, 201, response.content)
        copy = Collection.objects.get(pk=response.data["id"])
        self.assertIn(self.source, copy.source_set.all())

    def test_uses_explicit_name_when_given(self):
        response = self.client.post(
            URL, {"collection_id": self.original.id, "name": "My Custom Copy"}, format="json")

        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["name"], "My Custom Copy")

    def test_duplicate_name_returns_400_with_error_body(self):
        Collection.objects.create(name="Taken Name")

        response = self.client.post(
            URL, {"collection_id": self.original.id, "name": "Taken Name"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)

    def test_missing_original_collection_returns_404(self):
        response = self.client.post(URL, {"collection_id": 999999}, format="json")
        self.assertEqual(response.status_code, 404)

    def test_logs_action_history_against_the_new_collection(self):
        response = self.client.post(URL, {"collection_id": self.original.id}, format="json")
        self.assertEqual(response.status_code, 201, response.content)

        history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.COLLECTION, object_id=response.data["id"],
            action_type="copy-collection").first()
        self.assertIsNotNone(history)
