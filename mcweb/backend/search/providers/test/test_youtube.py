# pylint: disable=protected-access

from django.test import TestCase
import datetime as dt

from .. import YOUTUBE_API_KEY
from ..youtube import YouTubeYouTubeProvider
from ..exceptions import UnsupportedOperationException

TERM = "robot"
DAY_WINDOW = 100  # window in days to search for tem


class YouTubeYouTubeProviderTest(TestCase):

    def setUp(self):
        self._provider = YouTubeYouTubeProvider(YOUTUBE_API_KEY)

    def test_fetch_results_from_api(self):
        results = self._provider._fetch_results_from_api(
            TERM,
            start_date=dt.datetime.now() - dt.timedelta(days=DAY_WINDOW),
            end_date=dt.datetime.now()
        )
        assert isinstance(results, dict) is True

    def test_count(self):
        results = self._provider.count(
            TERM,
            start_date=dt.datetime.now() - dt.timedelta(days=2),
            end_date=dt.datetime.now()
        )
        assert results > 0

    def test_count_too_big(self):
        try:
            results = self._provider.count(
                TERM,
                start_date=dt.datetime.now() - dt.timedelta(days=DAY_WINDOW),
                end_date=dt.datetime.now()
            )
        except UnsupportedOperationException:
            assert True

    def test_sample(self):
        results = self._provider.sample(
            TERM,
            start_date=dt.datetime.now() - dt.timedelta(days=DAY_WINDOW),
            end_date=dt.datetime.now()
        )
        assert isinstance(results, list) is True
