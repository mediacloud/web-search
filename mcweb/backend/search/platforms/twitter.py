import datetime as dt
import requests
import dateparser
from typing import List, Dict
import logging

from .provider import ContentProvider
from .exceptions import UnsupportedOperationException
from util.cache import cache_by_kwargs


TWITTER_API_URL = 'https://api.twitter.com/2/'


class TwitterTwitterProvider(ContentProvider):

    def __init__(self, bearer_token=None):
        super(TwitterTwitterProvider, self).__init__()
        self._logger = logging.getLogger(__name__)
        self._bearer_token = bearer_token

    def sample(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 10, **kwargs) -> List[Dict]:
        """
        Return a list of historical tweets matching the query.
        :param query:
        :param start_date:
        :param end_date:
        :param limit:
        :param kwargs:
        :return:
        """
        # sample of historical tweets
        params = {
            "query": query,
            "max_results": limit,
            "start_time": start_date.isoformat("T") + "Z",
            "end_time": end_date.isoformat("T") + "Z",
            "tweet.fields": ",".join(["author_id", "created_at", "public_metrics"]),
            "expansions": "author_id"
        }
        results = self._cached_query("tweets/search/all", params)
        return TwitterTwitterProvider._tweets_to_rows(results)

    def count(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> int:
        results = self.count_over_time(query, start_date, end_date, **kwargs)  # use the cached counts being made already
        total = sum([r['count'] for r in results['counts']])
        return total

    def count_over_time(self, query: str, start_date: dt.datetime,
                        end_date: dt.datetime,
                        **kwargs) -> Dict:
        """
        Count how many tweets match the query over the 31 days before end_date.
        :param query:
        :param start_date:
        :param end_date:
        :param kwargs:
        :return:
        """
        params = dict(
            query=query,
            granularity='day',
            start_time=start_date.isoformat("T") + "Z",
            end_time=end_date.isoformat("T") + "Z",
        )
        more_data = True
        next_token = None
        data = []
        while more_data:
            params['next_token'] = next_token
            results = self._cached_query("tweets/counts/all", params)
            data += reversed(results['data'])
            if ('meta' in results) and ('next_token' in results['meta']):
                next_token = results['meta']['next_token']
                more_data = True
            else:
                next_token = None
                more_data = False
        to_return = []
        for d in data:
            to_return.append({
                'date': dateparser.parse(d['start']),
                'timestamp': dateparser.parse(d['start']).timestamp(),
                'count': d['tweet_count'],
            })
        return {'counts': to_return}

    def all_items(self, query: str, start_date: dt.datetime, end_date: dt.datetime, page_size: int = 500,
                  **kwargs):
        next_token = None
        more_data = True
        params = {
            "query": query,
            "max_results": page_size,
            "start_time": start_date.isoformat("T") + "Z",
            "end_time": end_date.isoformat("T") + "Z",
            "tweet.fields": ",".join(["author_id", "created_at", "public_metrics"]),
            "expansions": "author_id",
        }
        while more_data:
            params['next_token'] = next_token
            results = self._cached_query("tweets/search/all", params)
            result_count = results['meta']['result_count']
            if result_count == 0:
                more_data = False
                continue
            page = TwitterTwitterProvider._tweets_to_rows(results)
            yield page
            next_token = results['meta']['next_token'] if 'next_token' in results['meta'] else None
            more_data = next_token is not None


    @cache_by_kwargs()
    def _cached_query(self, endpoint: str, params: Dict = None) -> Dict:
        """
        Run a generic query agains the Twitter historical search API
        :param endpoint:
        :param query:
        :param params:
        :return:
        """
        headers = {
            'Content-type': 'application/json',
            'Authorization': "Bearer {}".format(self._bearer_token)
        }
        r = requests.get(TWITTER_API_URL+endpoint, headers=headers, params=params)
        return r.json()

    @classmethod
    def _add_author_to_tweets(cls, results: Dict) -> None:
        user_id_lookup = {u['id']: u for u in results['includes']['users']}
        for t in results['data']:
            t['author'] = user_id_lookup[t['author_id']]

    @classmethod
    def _tweets_to_rows(cls, results: Dict) -> List:
        TwitterTwitterProvider._add_author_to_tweets(results)
        return [TwitterTwitterProvider._tweet_to_row(t) for t in results['data']]

    @classmethod
    def _tweet_to_row(cls, item: Dict) -> Dict:
        link = 'https://twitter.com/{}/status/{}'.format(item['author']['username'], item['id'])
        return {
            'media_name': '@'+item['author']['username'],
            'media_url': 'https://twitter.com/{}'.format(item['author']['username']),
            'stories_id': item['id'],
            'title': item['text'],
            'publish_date': dateparser.parse(item['created_at']),
            'url': link,
            'last_updated': dateparser.parse(item['created_at']),
            'author': item['author']['name'],
            'language': None,
            'retweet_count': item['public_metrics']['retweet_count'],
            'reply_count': item['public_metrics']['reply_count'],
            'like_count': item['public_metrics']['like_count'],
            'quote_count': item['public_metrics']['quote_count'],
        }

    def normalized_count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime,
                                   **kwargs) -> Dict:
        raise UnsupportedOperationException("Can't search twitter for all tweets in a timeframe")

    def __repr__(self):
        # important to keep this unique among platforms so that the caching works right
        return "TwitterTwitterProvider"
