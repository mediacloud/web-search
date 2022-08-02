import unittest
import datetime as dt

from server import TWITTER_API_BEARER_TOKEN
from server.platforms.twitter import TwitterTwitterProvider

TERM = "robots"


class TwitterTwitterProviderTest(unittest.TestCase):

    def setUp(self):
        self._provider = TwitterTwitterProvider(TWITTER_API_BEARER_TOKEN)

    def test_sample(self):
        results = self._provider.sample(TERM, start_date=dt.datetime.now() - dt.timedelta(days=5),
                                        end_date=dt.datetime.now())
        assert isinstance(results, list) is True
        for tweet in results:
            assert 'content' in tweet
            assert len(tweet['content']) > 0

    def test_count(self):
        results = self._provider.count(TERM, start_date=dt.datetime.now() - dt.timedelta(days=5),
                                       end_date=dt.datetime.now())
        assert results > 0

    def test_count_over_time(self):
        results = self._provider.count_over_time(TERM, start_date=dt.datetime.now() - dt.timedelta(days=5),
                                                 end_date=dt.datetime.now())
        assert 'counts' in results
        assert isinstance(results['counts'], list) is True
        assert len(results['counts']) == 6

    def test_longer_count_over_time(self):
        results = self._provider.count_over_time(TERM, start_date=dt.datetime.now() - dt.timedelta(days=45),
                                                 end_date=dt.datetime.now())
        assert 'counts' in results
        assert isinstance(results['counts'], list) is True
        assert len(results['counts']) == 46
