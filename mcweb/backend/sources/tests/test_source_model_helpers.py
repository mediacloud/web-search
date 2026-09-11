from django.test import TestCase

from ..models import AlternativeDomain, Source


class UpdateStoriesPerWeekTest(TestCase):
    """
    Source.update_stories_per_week (called from alerts.py) has a bare
    except that swallows any error and just logs -- worth confirming a
    missing source doesn't raise, and a real one gets updated.
    """

    def test_updates_existing_source(self):
        source = Source.objects.create(name="example.com", homepage="http://example.com")
        Source.update_stories_per_week(source.id, 42)
        source.refresh_from_db()
        self.assertEqual(source.stories_per_week, 42)

    def test_missing_source_does_not_raise(self):
        Source.update_stories_per_week(999999, 42)  # should log a warning, not raise


class UpdateLastRescrapedTest(TestCase):
    """Source.update_last_rescraped (called from scrape.py), same bare-except pattern."""

    def test_updates_existing_source(self):
        source = Source.objects.create(name="example.com", homepage="http://example.com")
        Source.update_last_rescraped(source.id, "found 3 new feeds")
        source.refresh_from_db()
        self.assertIsNotNone(source.last_rescraped)
        self.assertEqual(source.last_rescraped_msg, "found 3 new feeds")

    def test_missing_source_does_not_raise(self):
        Source.update_last_rescraped(999999, "summary")  # should log a warning, not raise


class DomainExistsTest(TestCase):
    """
    Source.domain_exists (called from AlternativeDomainViewSet.create) checks
    both the Source and AlternativeDomain tables -- untested directly before.
    """

    def test_false_when_nothing_matches(self):
        self.assertFalse(Source.domain_exists("nomatch.com", None))

    def test_true_when_a_source_name_matches(self):
        Source.objects.create(name="example.com", homepage="http://example.com")
        self.assertTrue(Source.domain_exists("example.com", None))

    def test_true_when_an_alternative_domain_matches(self):
        source = Source.objects.create(name="example.com", homepage="http://example.com")
        AlternativeDomain.objects.create(source=source, domain="alt.example.com")
        self.assertTrue(Source.domain_exists("alt.example.com", None))

    def test_url_search_string_scopes_the_match(self):
        Source.objects.create(
            name="example.com", homepage="http://example.com",
            url_search_string="example.com/section/*")
        # same name, but no url_search_string -> not considered the same domain
        self.assertFalse(Source.domain_exists("example.com", None))
        self.assertTrue(Source.domain_exists("example.com", "example.com/section/*"))
