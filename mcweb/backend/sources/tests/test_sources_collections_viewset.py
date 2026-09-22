from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ..models import ActionHistory, Collection, Source

URL = "/api/sources/sources-collections/"


class SourcesCollectionsViewSetTest(APITestCase):
    """
    SourcesCollectionsViewSet manages Source<->Collection associations.
    Only the anonymous-401 path was tested before; this covers create,
    retrieve (both directions, gated by the `collection` query param), and
    destroy (both directions).
    """

    def setUp(self):
        self.user = User.objects.create_user(username="src_coll_staff", password="pw", is_staff=True)
        self.client.force_login(self.user)
        self.source = Source.objects.create(name="example.com", homepage="http://example.com")
        self.collection = Collection.objects.create(name="Test Collection")

    def test_create_adds_source_to_collection(self):
        response = self.client.post(URL, {
            "source_id": self.source.id,
            "collection_id": self.collection.id,
        }, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertIn(self.collection, self.source.collections.all())

        history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.COLLECTION, object_id=self.collection.id,
            action_type="add_to_collection").first()
        self.assertIsNotNone(history)

    def test_retrieve_sources_for_a_collection(self):
        self.collection.source_set.add(self.source)

        response = self.client.get(f"{URL}{self.collection.id}/", {"collection": "true"})

        self.assertEqual(response.status_code, 200, response.content)
        names = [row["name"] for row in response.data["sources"]]
        self.assertEqual(names, ["example.com"])

    def test_retrieve_collections_for_a_source(self):
        self.collection.source_set.add(self.source)

        response = self.client.get(f"{URL}{self.source.id}/")

        self.assertEqual(response.status_code, 200, response.content)
        names = [row["name"] for row in response.data["collections"]]
        self.assertEqual(names, ["Test Collection"])

    def test_destroy_removes_source_from_collection(self):
        self.collection.source_set.add(self.source)

        # .delete()'s data arg is a request body, not query params -- this
        # view reads request.query_params, so they must go in the URL.
        response = self.client.delete(
            f"{URL}{self.collection.id}/?collection=true&source_id={self.source.id}")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertNotIn(self.collection, self.source.collections.all())

        history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.COLLECTION, object_id=self.collection.id,
            action_type="remove_from_collection").first()
        self.assertIsNotNone(history)

    def test_destroy_removes_collection_from_source(self):
        self.collection.source_set.add(self.source)

        response = self.client.delete(
            f"{URL}{self.source.id}/?collection_id={self.collection.id}")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertNotIn(self.collection, self.source.collections.all())

