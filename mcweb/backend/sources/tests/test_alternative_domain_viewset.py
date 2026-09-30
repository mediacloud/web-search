from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ..models import ActionHistory, AlternativeDomain, Collection, Feed, Source

URL = "/api/sources/alternative-domains/"


class AlternativeDomainViewSetCreateBareDomainTest(APITestCase):
    """
    AlternativeDomainViewSet.create has two branches. This covers the
    "add a bare domain string" branch (alternative_domain given, no
    alternative_domain_id) -- had no coverage before.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="alt_domain_staff", password="pw", is_staff=True)
        self.client.force_login(self.user)
        self.source = Source.objects.create(name="example.com", homepage="http://example.com")

    def test_adds_a_new_alternative_domain(self):
        response = self.client.post(URL, {
            "source_id": self.source.id,
            "alternative_domain": "alt.example.com",
        }, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(
            AlternativeDomain.objects.filter(source=self.source, domain="alt.example.com").exists())

    def test_rejects_domain_that_already_exists_as_a_source(self):
        Source.objects.create(name="taken.com", homepage="http://taken.com")

        response = self.client.post(URL, {
            "source_id": self.source.id,
            "alternative_domain": "taken.com",
        }, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertFalse(AlternativeDomain.objects.filter(domain="taken.com").exists())

    def test_rejects_domain_that_already_exists_as_an_alternative_domain(self):
        AlternativeDomain.objects.create(source=self.source, domain="already-alt.com")
        other_source = Source.objects.create(name="other.com", homepage="http://other.com")

        response = self.client.post(URL, {
            "source_id": other_source.id,
            "alternative_domain": "already-alt.com",
        }, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(AlternativeDomain.objects.filter(domain="already-alt.com").count(), 1)

class AlternativeDomainViewSetMergeSourceTest(APITestCase):
    """
    Covers the other create() branch: turning an existing Source into an
    alternative domain of another Source. This merges the losing source's
    collections and feeds into the winning source, then deletes the losing
    source -- real, untested data-migration logic.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="alt_domain_merge_staff", password="pw", is_staff=True)
        self.client.force_login(self.user)
        self.winner = Source.objects.create(name="winner.com", homepage="http://winner.com")
        self.loser = Source.objects.create(name="loser.com", homepage="http://loser.com")

    def test_merges_collections_and_feeds_and_deletes_losing_source(self):
        collection = Collection.objects.create(name="Shared Collection")
        collection.source_set.add(self.loser)
        feed = Feed.objects.create(source=self.loser, url="http://loser.com/feed.xml")

        response = self.client.post(URL, {
            "source_id": self.winner.id,
            "alternative_domain_id": self.loser.id,
        }, format="json")

        self.assertEqual(response.status_code, 200, response.content)

        alt = AlternativeDomain.objects.get(source=self.winner, domain="loser.com")
        self.assertIsNotNone(alt)

        self.assertFalse(Source.objects.filter(pk=self.loser.id).exists())
        self.assertIn(collection, self.winner.collections.all())

        feed.refresh_from_db()
        self.assertEqual(feed.source_id, self.winner.id)

        history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.ALTERNATIVE_DOMAIN, action_type="create").first()
        self.assertIsNotNone(history)

    def test_missing_source_returns_404(self):
        response = self.client.post(URL, {
            "source_id": 999999,
            "alternative_domain_id": self.loser.id,
        }, format="json")
        self.assertEqual(response.status_code, 404)

class AlternativeDomainViewSetReadTest(APITestCase):
    """Default list/retrieve/destroy behavior (not overridden), plus anonymous rejection."""

    def setUp(self):
        self.user = User.objects.create_user(username="alt_domain_read_staff", password="pw", is_staff=True)
        self.client.force_login(self.user)
        self.source = Source.objects.create(name="example.com", homepage="http://example.com")
        self.alt = AlternativeDomain.objects.create(source=self.source, domain="alt.example.com")


    def test_staff_can_delete(self):
        response = self.client.delete(f"{URL}{self.alt.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(AlternativeDomain.objects.filter(pk=self.alt.id).exists())
