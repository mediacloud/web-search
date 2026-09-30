from django.contrib.auth.models import User
from django.test import TestCase

from ..models import Collection
from ..tasks import schedule_scrape_collection


class ScheduleScrapeCollectionTest(TestCase):
    """
    schedule_scrape_collection (called from CollectionViewSet.rescrape_feeds)
    is much simpler than its Source analog (schedule_scrape_source) --
    Collections have no homepage/url_search_string to validate -- but had
    no direct test either.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="scrape_collection_test_user", password="pw")


    def test_valid_collection_schedules_a_task(self):
        collection = Collection.objects.create(name="Scrapable Collection")
        result = schedule_scrape_collection(collection.id, self.user)
        self.assertIn("task", result)
