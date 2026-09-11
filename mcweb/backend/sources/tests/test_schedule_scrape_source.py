from django.contrib.auth.models import User
from django.test import TestCase

from ..models import Source
from ..tasks import schedule_scrape_source


class ScheduleScrapeSourceTest(TestCase):
    """
    schedule_scrape_source (called from SourcesViewSet.rescrape_feeds and
    upload_sources when rescrape=True) has real validation logic that had
    no direct test: refuses to schedule a rescrape for a Source that
    doesn't have a homepage, or that has a url_search_string (since
    rescraping is scoped to whole domains, not child sources).
    """

    def setUp(self):
        self.user = User.objects.create_user(username="scrape_test_user", password="pw")

    def test_missing_source_raises_does_not_exist(self):
        # Source.objects.get() raises DoesNotExist rather than returning
        # None, so the `if not source: return_error(...)` branch in
        # schedule_scrape_source is actually unreachable dead code -- this
        # documents the real current behavior.
        with self.assertRaises(Source.DoesNotExist):
            schedule_scrape_source(999999, self.user)

    def test_source_without_homepage_is_rejected(self):
        source = Source.objects.create(name="nohomepage.com", homepage="")
        result = schedule_scrape_source(source.id, self.user)
        self.assertIn("error", result)
        self.assertIn("missing homepage", result["error"])

    def test_source_with_url_search_string_is_rejected(self):
        source = Source.objects.create(
            name="scoped.com", homepage="http://scoped.com",
            url_search_string="scoped.com/section/*")
        result = schedule_scrape_source(source.id, self.user)
        self.assertIn("error", result)
        self.assertIn("url_search_string", result["error"])

    def test_valid_source_schedules_a_task(self):
        source = Source.objects.create(name="scrapable.com", homepage="http://scrapable.com")
        result = schedule_scrape_source(source.id, self.user)
        self.assertIn("task", result)
