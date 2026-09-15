from django.db import IntegrityError
from django.test import TestCase

from ..models import Feed, Source


class FeedModelTest(TestCase):
    """
    Feed itself has no custom logic (no clean/save overrides), but it has
    two real DB-level behaviors worth pinning down: the unique constraint
    on `url`, and the CASCADE delete from its `source` FK.
    """

    def setUp(self):
        self.source = Source.objects.create(
            name="example.com", homepage="http://example.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

    def test_url_must_be_unique(self):
        Feed.objects.create(source=self.source, url="http://example.com/feed.xml")
        with self.assertRaises(IntegrityError):
            Feed.objects.create(source=self.source, url="http://example.com/feed.xml")

    def test_deleting_source_cascades_to_its_feeds(self):
        feed = Feed.objects.create(source=self.source, url="http://example.com/feed.xml")
        self.source.delete()
        self.assertFalse(Feed.objects.filter(pk=feed.pk).exists())
