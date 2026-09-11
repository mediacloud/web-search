from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ...users.models import Profile
from ..models import AlternativeDomain, Collection, Source


class SourcesViewSetQuerysetFiltersTest(APITestCase):
    """
    SourcesViewSet.get_queryset has three untested behaviors: the
    collection_id filter, the hardcoded platform=ONLINE_NEWS exclusion
    (non-online-news Sources are invisible through this viewset entirely),
    and the union-based `name` search across name/label/alternative-domain.
    """

    URL = "/api/sources/sources/"

    def setUp(self):
        self.user = User.objects.create_user(username="sources_filter_user", password="pw", is_staff=True)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.user)

    def _names(self, response):
        body = response.data
        results = body["results"] if isinstance(body, dict) and "results" in body else body
        return {row["name"] for row in results}

    def test_collection_id_filters_to_member_sources(self):
        in_collection = Source.objects.create(
            name="incollection.com", homepage="http://incollection.com")
        outside_collection = Source.objects.create(
            name="outsidecollection.com", homepage="http://outsidecollection.com")
        collection = Collection.objects.create(name="Filter Test Collection")
        collection.source_set.add(in_collection)

        response = self.client.get(self.URL, {"collection_id": collection.id})
        self.assertEqual(response.status_code, 200, response.content)
        names = self._names(response)
        self.assertIn("incollection.com", names)
        self.assertNotIn("outsidecollection.com", names)

    def test_non_online_news_sources_are_never_returned(self):
        Source.objects.create(
            name="youtubesource", homepage="http://youtube.com/channel/x",
            platform=Source.SourcePlatforms.YOUTUBE)
        online_news_source = Source.objects.create(
            name="onlinenewssource.com", homepage="http://onlinenewssource.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

        response = self.client.get(self.URL)
        self.assertEqual(response.status_code, 200, response.content)
        names = self._names(response)
        self.assertIn("onlinenewssource.com", names)
        self.assertNotIn("youtubesource", names)

    def test_name_search_matches_by_name(self):
        Source.objects.create(name="findablebyname.com", homepage="http://findablebyname.com")
        Source.objects.create(name="unrelated.com", homepage="http://unrelated.com")

        response = self.client.get(self.URL, {"name": "findablebyname"})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(self._names(response), {"findablebyname.com"})

    def test_name_search_matches_by_label(self):
        Source.objects.create(
            name="labelsearch.com", homepage="http://labelsearch.com", label="A Special Label")
        Source.objects.create(name="unrelated.com", homepage="http://unrelated.com")

        response = self.client.get(self.URL, {"name": "Special"})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(self._names(response), {"labelsearch.com"})

    def test_name_search_matches_by_alternative_domain(self):
        source = Source.objects.create(name="mainsource.com", homepage="http://mainsource.com")
        AlternativeDomain.objects.create(source=source, domain="findablealt.com")
        Source.objects.create(name="unrelated.com", homepage="http://unrelated.com")

        response = self.client.get(self.URL, {"name": "findablealt"})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(self._names(response), {"mainsource.com"})
