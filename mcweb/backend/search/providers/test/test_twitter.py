from django.test import TestCase
import datetime as dt

from .. import TWITTER_API_BEARER_TOKEN
from ..twitter import TwitterTwitterProvider

TERM = "robots"


class TwitterTwitterProviderTest(TestCase):

    def setUp(self):
        self._provider = TwitterTwitterProvider(TWITTER_API_BEARER_TOKEN)
        self._now = dt.datetime.now() - dt.timedelta(minutes=1)  # can't query for right now
        self._5_days_ago = dt.datetime.now() - dt.timedelta(days=5)

    def test_sample(self):
        results = self._provider.sample(TERM, start_date=self._5_days_ago, end_date=self._now)
        assert isinstance(results, list) is True
        for tweet in results:
            assert 'content' in tweet
            assert len(tweet['content']) > 0
            assert 'language' in tweet
            assert len(tweet['language']) == 2

    def test_count(self):
        results = self._provider.count(TERM, start_date=self._5_days_ago, end_date=self._now)
        assert results > 0

    def test_count_over_time(self):
        results = self._provider.count_over_time(TERM, start_date=self._5_days_ago, end_date=self._now)
        assert 'counts' in results
        assert isinstance(results['counts'], list) is True
        assert len(results['counts']) == 6

    def test_longer_count_over_time(self):
        results = self._provider.count_over_time(TERM, start_date=dt.datetime.now() - dt.timedelta(days=45),
                                                 end_date=self._now)
        assert 'counts' in results
        assert isinstance(results['counts'], list) is True
        assert len(results['counts']) == 46
