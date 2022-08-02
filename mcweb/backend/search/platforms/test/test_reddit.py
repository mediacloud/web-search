import unittest
import datetime as dt

from server.platforms.reddit import RedditPushshiftProvider


class RedditPushshiftProviderTest(unittest.TestCase):

    def setUp(self):
        self._provider = RedditPushshiftProvider()

    def test_count(self):
        results = self._provider.count("Trump", dt.datetime.strptime("2019-01-01", "%Y-%m-%d"),
                                        dt.datetime.strptime("2019-02-01", "%Y-%m-%d"))
        assert results > 0

    def test_sample(self):
        results = self._provider.sample("Trump", dt.datetime.strptime("2019-01-01", "%Y-%m-%d"),
                                        dt.datetime.strptime("2019-02-01", "%Y-%m-%d"))
        last_score = 9999999999999
        for post in results:
            assert last_score >= post['score']
            last_score = post['score']

    def test_count_over_time(self):
        results = self._provider.count_over_time("Trump", dt.datetime.strptime("2019-01-01", "%Y-%m-%d"),
                                                 dt.datetime.strptime("2019-02-01", "%Y-%m-%d"))
        for item in results['counts']:
            assert 'date' in item
            assert 'count' in item

    def test_normalized_count_over_time(self):
        results = self._provider.normalized_count_over_time("Trump",
                                                            dt.datetime.strptime("2019-01-01", "%Y-%m-%d"),
                                                            dt.datetime.strptime("2019-02-01", "%Y-%m-%d"))
        assert 'counts' in results
        assert 'total' in results
        assert results['total'] > 0
        assert 'normalized_total' in results
