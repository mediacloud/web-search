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
                                             end_date=dt.datetime(2023, 1, 5)):
            assert len(page) > 0
            total_items += len(page)
            page_count += 1
        assert page_count == 6
        assert total_items == 297
