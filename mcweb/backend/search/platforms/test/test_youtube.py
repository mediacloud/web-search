# pylint: disable=protected-access

import unittest
import datetime as dt

from server import YOUTUBE_API_KEY
from server.platforms.youtube import YouTubeYouTubeProvider

TERM = "robot"
DAY_WINDOW = 100  # window in days to search for tem


class YouTubeYouTubeProviderTest(unittest.TestCase):

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
            start_date=dt.datetime.now() - dt.timedelta(days=DAY_WINDOW),
            end_date=dt.datetime.now()
        )
        assert (results == "> 1000000") or (results > 0)

    def test_sample(self):
        results = self._provider.sample(
            TERM,
            start_date=dt.datetime.now() - dt.timedelta(days=DAY_WINDOW),
            end_date=dt.datetime.now()
        )
        assert isinstance(results, list) is True
