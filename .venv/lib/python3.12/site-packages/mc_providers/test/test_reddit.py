'''
import unittest
import datetime as dt

from ..reddit import RedditPushshiftProvider


class RedditPushshiftProviderTest(unittest.TestCase):

    def setUp(self):
        self._provider = RedditPushshiftProvider()

    def test_count(self):
        total_matching = self._provider.count("Trump", dt.datetime(2022, 11, 1), dt.datetime(2022, 11, 10))
        assert total_matching > 0

    def test_subreddits(self):
        mathching_posts = self._provider.sample("professor", dt.datetime(2022, 11, 1), dt.datetime(2022, 12, 1),
                                                subreddits=['NEU'])
        assert len(mathching_posts) > 0
        for post in mathching_posts:
            assert post['subreddit'] == 'NEU'

    def test_sample(self):
        sample_posts = self._provider.sample("Trump", dt.datetime(2022, 11, 1), dt.datetime(2022, 12, 1))
        assert len(sample_posts) > 0
        last_score = 9999999999999
        for post in sample_posts:
            assert last_score >= post['score']
            last_score = post['score']
            assert 'language' in post
            assert len(post['language']) == 2

    def test_count_over_time(self):
        results = self._provider.count_over_time("Trump", dt.datetime(2022, 11, 1), dt.datetime(2022, 12, 1))
        assert 'counts' in results
        assert isinstance(results['counts'], list) is True
        assert len(results['counts']) == 29
        # make sure dates are unique
        dates = [d['date'] for d in results['counts']]
        assert len(set(dates)) == len(dates)

    def test_normalized_count_over_time(self):
        results = self._provider.normalized_count_over_time("Biden", dt.datetime(2022, 11, 1), dt.datetime(2022, 12, 1))
        assert 'counts' in results
        assert 'total' in results
        assert results['total'] > 0
        assert 'normalized_total' in results

    def test_languages(self):
        results = self._provider.languages("Trump", dt.datetime(2022, 11, 1), dt.datetime(2022, 12, 1))
        last_count = 99999999999
        last_ratio = 1
        assert len(results) > 0
        for item in results:
            assert len(item['language']) == 2
            assert last_count >= item['count']
            last_count = item['count']
            assert last_ratio >= item['ratio']
            last_ratio = item['ratio']
'''