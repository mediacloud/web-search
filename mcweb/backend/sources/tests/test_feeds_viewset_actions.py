from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from rest_framework.test import APITestCase


def _mock_rss():
    rss = MagicMock()
    rss.__enter__.return_value = rss
    rss.__exit__.return_value = False
    return rss


class FeedsViewSetActionsTest(APITestCase):
    """
    The 5 custom @actions on FeedsViewSet (details, feed-details, stories,
    history, fetch) are thin synchronous passthroughs to the external
    rss-fetcher service. None had a test before. Also pins down a fix for
    a real bug: `stories` used to crash with an UnboundLocalError (500)
    instead of a clean 400 when called with neither `feed_id` nor
    `source_id`.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="feeds_actions_user", password="pw")
        self.client.force_login(self.user)

    @patch("backend.sources.api._rss_fetcher_api")
    def test_details_returns_feeds_for_source(self, mock_rss_fetcher):
        rss = _mock_rss()
        rss.source_feeds.return_value = [{"id": 1, "url": "http://example.com/feed.xml"}]
        mock_rss_fetcher.return_value = rss

        response = self.client.get("/api/sources/feeds/details/", {"source_id": 42})

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["feeds"], [{"id": 1, "url": "http://example.com/feed.xml"}])
        rss.source_feeds.assert_called_once_with(42)

    @patch("backend.sources.api._rss_fetcher_api")
    def test_feed_details_returns_feed(self, mock_rss_fetcher):
        rss = _mock_rss()
        rss.feed.return_value = {"id": 7, "url": "http://example.com/feed.xml"}
        mock_rss_fetcher.return_value = rss

        response = self.client.get("/api/sources/feeds/feed-details/", {"feed_id": 7})

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["feed"], {"id": 7, "url": "http://example.com/feed.xml"})
        rss.feed.assert_called_once_with(7)

    @patch("backend.sources.api._rss_fetcher_api")
    def test_stories_with_feed_id(self, mock_rss_fetcher):
        rss = _mock_rss()
        rss.feed_stories.return_value = [{"title": "a story"}]
        mock_rss_fetcher.return_value = rss

        response = self.client.get("/api/sources/feeds/stories/", {"feed_id": 7})

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["stories"], [{"title": "a story"}])
        rss.feed_stories.assert_called_once_with(7)
        rss.source_stories.assert_not_called()

    @patch("backend.sources.api._rss_fetcher_api")
    def test_stories_with_source_id(self, mock_rss_fetcher):
        rss = _mock_rss()
        rss.source_stories.return_value = [{"title": "a story"}]
        mock_rss_fetcher.return_value = rss

        response = self.client.get("/api/sources/feeds/stories/", {"source_id": 42})

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["stories"], [{"title": "a story"}])
        rss.source_stories.assert_called_once_with(42)

    @patch("backend.sources.api._rss_fetcher_api")
    def test_stories_with_neither_param_is_a_clean_400(self, mock_rss_fetcher):
        rss = _mock_rss()
        mock_rss_fetcher.return_value = rss

        response = self.client.get("/api/sources/feeds/stories/")

        self.assertEqual(response.status_code, 400)
        rss.feed_stories.assert_not_called()
        rss.source_stories.assert_not_called()

    @patch("backend.sources.api._rss_fetcher_api")
    def test_history_is_sorted_most_recent_first(self, mock_rss_fetcher):
        rss = _mock_rss()
        rss.feed_history.return_value = [
            {"created_at": "2026-01-01T00:00:00", "status": "old"},
            {"created_at": "2026-03-01T00:00:00", "status": "newest"},
            {"created_at": "2026-02-01T00:00:00", "status": "middle"},
        ]
        mock_rss_fetcher.return_value = rss

        response = self.client.get("/api/sources/feeds/history/", {"feed_id": 7})

        self.assertEqual(response.status_code, 200, response.content)
        statuses = [row["status"] for row in response.data["feed"]]
        self.assertEqual(statuses, ["newest", "middle", "old"])

    @patch("backend.sources.api._rss_fetcher_api")
    def test_fetch_sums_feed_and_source_counts(self, mock_rss_fetcher):
        rss = _mock_rss()
        rss.feed_fetch_soon.return_value = 1
        rss.source_fetch_soon.return_value = 3
        mock_rss_fetcher.return_value = rss

        response = self.client.get("/api/sources/feeds/fetch/", {"feed_id": 7, "source_id": 42})

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["fetch_response"], 4)
        rss.feed_fetch_soon.assert_called_once_with(7)
        rss.source_fetch_soon.assert_called_once_with(42)

    @patch("backend.sources.api._rss_fetcher_api")
    def test_fetch_with_only_feed_id(self, mock_rss_fetcher):
        rss = _mock_rss()
        rss.feed_fetch_soon.return_value = 1
        mock_rss_fetcher.return_value = rss

        response = self.client.get("/api/sources/feeds/fetch/", {"feed_id": 7})

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["fetch_response"], 1)
        rss.source_fetch_soon.assert_not_called()
