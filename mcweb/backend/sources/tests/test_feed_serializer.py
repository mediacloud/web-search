from rest_framework.test import APITestCase

from ..models import Feed, Source
from ..serializer import FeedSerializer


class FeedSerializerTest(APITestCase):
    """
    FeedSerializer has no active custom validation (the one validate_url
    method in the source is commented out/dead), so duplicate-url
    rejection relies entirely on DRF's auto-generated UniqueValidator for
    the model's unique=True field -- worth confirming that actually fires.
    """

    def setUp(self):
        self.source = Source.objects.create(
            name="example.com", homepage="http://example.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

    def test_create_via_serializer(self):
        serializer = FeedSerializer(data={
            "url": "http://example.com/feed.xml",
            "source": self.source.id,
            "name": "Example Feed",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        feed = serializer.save()
        self.assertEqual(feed.url, "http://example.com/feed.xml")
        self.assertEqual(feed.source_id, self.source.id)

    def test_duplicate_url_is_rejected(self):
        Feed.objects.create(source=self.source, url="http://example.com/feed.xml")
        serializer = FeedSerializer(data={
            "url": "http://example.com/feed.xml",
            "source": self.source.id,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn("url", serializer.errors)

    def test_update_via_serializer_only_changes_given_fields(self):
        feed = Feed.objects.create(
            source=self.source, url="http://example.com/feed.xml", name="Old Name",
            admin_rss_enabled=False)
        serializer = FeedSerializer(feed, data={"name": "New Name"}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.name, "New Name")
        self.assertEqual(updated.url, "http://example.com/feed.xml")
        self.assertFalse(updated.admin_rss_enabled)
