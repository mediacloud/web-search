from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ...users.models import Profile
from ..models import Collection, Source

URL = "/api/sources/collections/"


class CollectionQuerysetFiltersTest(APITestCase):
    """
    CollectionViewSet.get_queryset has three untested behaviors: the
    source_id filter, the name search, and a hardcoded platform=ONLINE_NEWS
    filter that makes non-online-news collections invisible through this
    viewset entirely (list, retrieve, update, destroy all use get_queryset()
    -- only rescrape_feeds bypasses it, covered separately in Tier 3).
    """

    def setUp(self):
        self.user = User.objects.create_user(username="collection_filter_staff", password="pw", is_staff=True)
        # retrieve() checks/increments quota unconditionally, even on a
        # 404; quota_mediacloud set explicitly so it doesn't fall back to
        # constance.config (which needs a live Redis connection)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.user)

    def _names(self, response):
        body = response.data
        results = body["results"] if isinstance(body, dict) and "results" in body else body
        return {row["name"] for row in results}

    def test_source_id_filters_to_collections_containing_that_source(self):
        source = Source.objects.create(name="example.com", homepage="http://example.com")
        containing = Collection.objects.create(name="Containing Collection")
        containing.source_set.add(source)
        Collection.objects.create(name="Unrelated Collection")

        response = self.client.get(URL, {"source_id": source.id})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self._names(response), {"Containing Collection"})

    def test_name_search_matches_partial_word(self):
        Collection.objects.create(name="Findable Collection")
        Collection.objects.create(name="Unrelated")

        response = self.client.get(URL, {"name": "Findable"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self._names(response), {"Findable Collection"})

    def test_non_online_news_collection_is_never_returned(self):
        Collection.objects.create(name="Reddit Collection", platform=Collection.CollectionPlatforms.REDDIT)
        Collection.objects.create(name="Online News Collection", platform=Collection.CollectionPlatforms.ONLINE_NEWS)

        response = self.client.get(URL)

        self.assertEqual(response.status_code, 200)
        names = self._names(response)
        self.assertIn("Online News Collection", names)
        self.assertNotIn("Reddit Collection", names)

    def test_non_online_news_collection_404s_on_retrieve_even_for_staff(self):
        collection = Collection.objects.create(
            name="Reddit Collection", platform=Collection.CollectionPlatforms.REDDIT)

        response = self.client.get(f"{URL}{collection.id}/")

        self.assertEqual(response.status_code, 404)
