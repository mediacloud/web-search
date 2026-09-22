from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ..models import Source

URL = "/api/sources/sources/sources-from-list/"


class SourcesFromListTest(APITestCase):
    """
    sources_from_list (used by SelectedMedia.jsx via
    useListSourcesFromArrayQuery) had no coverage, including a real bug:
    calling it with no `s` query param at all crashed with an unhandled
    TypeError (len(None)) instead of returning an empty list.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="sources_from_list_user", password="pw")
        self.client.force_login(self.user)
        self.source_a = Source.objects.create(name="a.com", homepage="http://a.com")
        self.source_b = Source.objects.create(name="b.com", homepage="http://b.com")

    def test_returns_matching_sources_in_order_of_ids_requested(self):
        response = self.client.get(URL, {"s": f"{self.source_a.id},{self.source_b.id}"})
        self.assertEqual(response.status_code, 200, response.content)
        names = {row["name"] for row in response.data["sources"]}
        self.assertEqual(names, {"a.com", "b.com"})

    def test_non_numeric_ids_are_silently_dropped(self):
        response = self.client.get(URL, {"s": f"{self.source_a.id},not-a-number"})
        self.assertEqual(response.status_code, 200, response.content)
        names = {row["name"] for row in response.data["sources"]}
        self.assertEqual(names, {"a.com"})

    def test_missing_s_param_returns_empty_list_not_a_500(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["sources"], [])

