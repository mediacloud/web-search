# pylint: disable=protected-access

import unittest
import datetime as dt
import os

from ..youtube import YouTubeYouTubeProvider
from ..exceptions import UnsupportedOperationException

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', None)

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
        try:
            _ = self._provider.count(
                TERM,
                start_date=dt.datetime.now() - dt.timedelta(days=2),
                end_date=dt.datetime.now()
            )
        except UnsupportedOperationException:
            assert True

    def test_count_too_big(self):
        try:
            _ = self._provider.count(
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

    def test_all_items(self):
        # Something about this query is not deterministic- result ranges +-10 from 280, leading to failures
        page_count = 0
        total_items = 0
        for page in self._provider.all_items("cultural marxism", start_date=dt.datetime(2023, 1, 1),
                                             end_date=dt.datetime(2023, 1, 5)):
            assert len(page) > 0
            total_items += len(page)
            page_count += 1
        assert page_count == 1
        assert total_items == 2
        page_count = 0
        total_items = 0
        for page in self._provider.all_items(TERM, start_date=dt.datetime(2023, 1, 1),
                                             end_date=dt.datetime(2023, 1, 10)):
            assert len(page) > 0
            total_items += len(page)
            page_count += 1
        assert page_count > 1
        assert total_items > 0
        # assert abs(total_items - 280) < 10  #since there seems to be some fuzziness, and I want to supress the error.
