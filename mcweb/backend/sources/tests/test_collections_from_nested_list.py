from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ..models import Collection

URL = "/api/sources/collections/collections-from-nested-list/"


class CollectionsFromNestedListTest(APITestCase):
    """
    collections_from_nested_list (used by
    useLazyListCollectionsFromNestedArrayQuery) treats every query-param
    VALUE (regardless of key name) as its own comma-separated id list, and
    reduces the result down to just a list of lists of names -- intricate
    parsing logic with no prior coverage.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="nested_list_user", password="pw")
        self.client.force_login(self.user)
        self.collection_a = Collection.objects.create(name="A Collection")
        self.collection_b = Collection.objects.create(name="B Collection")
        self.collection_c = Collection.objects.create(name="C Collection")

    def test_each_query_param_becomes_its_own_group_of_names(self):
        response = self.client.get(URL, {
            "group1": f"{self.collection_a.id},{self.collection_b.id}",
            "group2": str(self.collection_c.id),
        })

        self.assertEqual(response.status_code, 200, response.content)
        groups = response.data["collection"]
        self.assertEqual(len(groups), 2)
        self.assertEqual(set(groups[0]), {"A Collection", "B Collection"})
        self.assertEqual(groups[1], ["C Collection"])

