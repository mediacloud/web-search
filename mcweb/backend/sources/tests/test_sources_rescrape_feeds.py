from unittest.mock import patch

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ..models import ActionHistory, Source

URL = "/api/sources/sources/rescrape-feeds/"


class SourcesRescrapeFeedsTest(APITestCase):
    """
    SourcesViewSet.rescrape_feeds (used by FeedMenu.jsx via
    useRescrapeForFeedsMutation) had no coverage: logs an ActionHistory
    entry then delegates to tasks.schedule_scrape_source (already unit
    tested directly in test_schedule_scrape_source.py), so this mocks that
    call to isolate the action's own logic.
    """

    def setUp(self):
        # POST actions on SourcesViewSet require staff (no "contributor"
        # tier for Sources -- see test_sources_viewset_permissions.py)
        self.user = User.objects.create_user(username="rescrape_feeds_user", password="pw", is_staff=True)
        self.client.force_login(self.user)
        self.source = Source.objects.create(name="example.com", homepage="http://example.com")

    @patch("backend.sources.api.schedule_scrape_source")
    def test_schedules_scrape_and_logs_action_history(self, mock_schedule):
        mock_schedule.return_value = {"task": "queued"}

        response = self.client.post(URL, {"source_id": self.source.id}, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data, {"task": "queued"})
        mock_schedule.assert_called_once_with(self.source.id, self.user)

        history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.SOURCE, object_id=self.source.id,
            action_type="rescrape-feeds-scheduled").first()
        self.assertIsNotNone(history)

    def test_missing_source_returns_404(self):
        response = self.client.post(URL, {"source_id": 999999}, format="json")
        self.assertEqual(response.status_code, 404)

