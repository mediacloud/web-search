from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ..models import Collection

URL = "/api/sources/collections/collections-from-list/"


class CollectionsFromListTest(APITestCase):
    """
    collections_from_list (used by useListCollectionsFromArrayQuery) had no
    coverage, including a real bug: calling it with no `c` query param at
    all crashed with an unhandled TypeError (len(None)) instead of
    returning an empty list -- same pattern already fixed for Feed/Source.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="collections_from_list_user", password="pw")
        self.client.force_login(self.user)
        self.collection_a = Collection.objects.create(name="A Collection")
        self.collection_b = Collection.objects.create(name="B Collection")

    def test_returns_matching_collections(self):
        response = self.client.get(URL, {"c": f"{self.collection_a.id},{self.collection_b.id}"})
        self.assertEqual(response.status_code, 200, response.content)
        names = {row["name"] for row in response.data["collections"]}
        self.assertEqual(names, {"A Collection", "B Collection"})

    def test_missing_c_param_returns_empty_list_not_a_500(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["collections"], [])

    def test_empty_c_param_returns_empty_list(self):
        response = self.client.get(URL, {"c": ""})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["collections"], [])
