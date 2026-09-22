import datetime as dt

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ...users.models import Profile
from ..models import AlternativeDomain, Collection, Source


class SourcesViewSerializerTest(APITestCase):
    """
    SourcesViewSerializer (used only for list/retrieve) has several
    computed fields with no prior coverage: collection_count and monitored
    (from queryset annotations), alternative_domains (a
    SerializerMethodField querying a different table), and a custom
    last_story date format.
    """

    URL = "/api/sources/sources/"

    def setUp(self):
        self.user = User.objects.create_user(username="sources_view_user", password="pw", is_staff=True)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.user)

        self.source = Source.objects.create(
            name="example.com", homepage="http://example.com", label="example.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS,
            last_story=dt.datetime(2026, 3, 15, tzinfo=dt.timezone.utc))

    def _detail_url(self):
        return f"{self.URL}{self.source.id}/"

    def test_collection_count_reflects_actual_membership(self):
        collection = Collection.objects.create(name="Test Collection", monitored=False)
        collection.source_set.add(self.source)

        response = self.client.get(self._detail_url())
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["collection_count"], 1)

    def test_monitored_is_true_when_in_a_monitored_collection(self):
        monitored_collection = Collection.objects.create(name="Monitored Collection", monitored=True)
        monitored_collection.source_set.add(self.source)

        response = self.client.get(self._detail_url())
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.data["monitored"])

    def test_alternative_domains_lists_associated_domains(self):
        AlternativeDomain.objects.create(source=self.source, domain="alt.example.com")

        response = self.client.get(self._detail_url())
        self.assertEqual(response.status_code, 200, response.content)
        domains = [row["domain"] for row in response.data["alternative_domains"]]
        self.assertEqual(domains, ["alt.example.com"])

    def test_last_story_uses_month_year_format(self):
        response = self.client.get(self._detail_url())
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["last_story"], "03/2026")
