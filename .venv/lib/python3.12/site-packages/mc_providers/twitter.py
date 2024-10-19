import datetime as dt
import requests
from typing import List, Dict
import logging
import random
from collections import Counter
import numpy as np 
from time import sleep

from .errors import deprecated
from .provider import ContentProvider
from .exceptions import UnsupportedOperationException
from .cache import CachingManager
from .language import top_detected

TWITTER_API_URL = 'https://api.twitter.com/2/'
TWITTER_DATE_FORMAT = '%Y-%m-%dT%H:%M:%S.%f%z'
DEFAULT_TIMEOUT = 60


@deprecated
class TwitterTwitterProvider(ContentProvider):
    """
    All these endpoints accept a `usernames: List[str]` keyword arg.
    """
    
    MAX_QUERY_LENGTH = 1024  # I think?
    POLITENESS_DELAY = 1  # sleep for half a second if we're gonna spam a bunch of queries
    
    def __init__(self, bearer_token=None, timeout=None, caching=True):
        super(TwitterTwitterProvider, self).__init__(caching)
        self._logger = logging.getLogger(__name__)
        self._bearer_token = bearer_token
        self._session = requests.Session()  # better performance to put all HTTP through this one object
        self._timeout = timeout or DEFAULT_TIMEOUT

    #Chunk'd
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
        all_results = []
        chunks = self._assemble_and_chunk_query_str(query, **kwargs)
        for subquery in chunks:
            params = {
                "query": subquery,
                "max_results": limit,
                "start_time": start_date.isoformat("T") + "Z",
                "end_time": self._fix_end_date(end_date).isoformat("T") + "Z",
                "tweet.fields": ",".join(["author_id", "created_at", "public_metrics"]),
                "expansions": "author_id",
            }
            results = self._cached_query("tweets/search/all", params)
            results = TwitterTwitterProvider._tweets_to_rows(results)
            all_results.extend(results)
            if len(chunks) > 1:
                
                sleep(self.POLITENESS_DELAY)
                
        if len(all_results) > limit:
            all_results = random.sample(all_results, limit) 
        return results

    @classmethod
    def _assembled_query_str(cls, query: str, **kwargs) -> str:
        usernames = kwargs.get('usernames', [])
        # need to put all those filters in single query string
        if len(usernames) == 0:
            assembled_query = query
        else:
            assembled_query = query + " (" + " OR ".join(["from:{}".format(name) for name in usernames]) + ")"
        # check if query too long
        # @see https://developer.twitter.com/en/docs/twitter-api/tweets/search/api-reference/get-tweets-search-all
        # if len(assembled_query) > 1024:
        #    raise RuntimeError("Twitter's max query length is 1024 characters - your query is {} characters. "
        #                       "Try changing collections.".format(len(assembled_query)))
        return assembled_query

    
    @classmethod
    def _assemble_and_chunk_query_str(cls, base_query: str, **kwargs) -> List:
        """
        If a query string is too long, we can attempt to run it anyway by splitting the domain substring (which is
        guaranteed to be only a sequence of ANDs) into parts, to produce multiple smaller queries which are
        collectively equivalent to the original.
        """
        usernames = kwargs.get('usernames', [])
        
        if len(base_query) > cls.MAX_QUERY_LENGTH:
            # of course there still is the possibility that the base query is too large, which
            # cannot be fixed by this method
            raise RuntimeError(f"Base Query cannot exceed {cls.MAX_QUERY_LENGTH} characters")
        
        queries = [cls._assembled_query_str(base_query, usernames=usernames)]
        queries_too_big = any([len(q_) > cls.MAX_QUERY_LENGTH for q_ in queries])
        username_divisor = 2
        
        if queries_too_big:
            while queries_too_big:
                chunked_users = np.array_split(usernames, username_divisor)
                queries = [cls._assembled_query_str(base_query, usernames=users) for users in chunked_users]
                queries_too_big = any([len(q_) > cls.MAX_QUERY_LENGTH for q_ in queries])
                username_divisor *= 2
            
        return queries
    
    # No need to chunk
    def count(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> int:
        results = self.count_over_time(query, start_date, end_date, **kwargs)  # use the cached counts being made already
        total = sum([r['count'] for r in results['counts']])
        return total
    
    # Chunk
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
        counter: Counter = Counter()

        for subquery in  self._assemble_and_chunk_query_str(query, **kwargs):
            #print(subquery)
            params = dict(
                query=subquery,
                granularity='day',
                start_time=start_date.isoformat("T") + "Z",
                end_time=self._fix_end_date(end_date).isoformat("T") + "Z",
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
            countable = {i["start"]:i["tweet_count"] for i in data}
            counter += Counter(countable)
                
        data = dict(counter)
        
        to_return = []
        for date, count in data.items():
            to_return.append({
                'date': dt.datetime.strptime(date, TWITTER_DATE_FORMAT),
                'timestamp': dt.datetime.strptime(date, TWITTER_DATE_FORMAT).timestamp(),
                'count': count,
            })
        return {'counts': to_return}

    # Chunk'd
    def all_items(self, query: str, start_date: dt.datetime, end_date: dt.datetime, page_size: int = 500,
                  **kwargs):
        
        for subquery in self._assemble_and_chunk_query_str(query, **kwargs):
            
            limit = kwargs['limit'] if 'limit' in kwargs else None
            next_token = None
            more_data = True
            params = {
                "query": subquery,
                "max_results": page_size,
                "start_time": start_date.isoformat("T") + "Z",
                "end_time": self._fix_end_date(end_date).isoformat("T") + "Z",
                "tweet.fields": ",".join(["author_id", "created_at", "public_metrics"]),
                "expansions": "author_id",
            }
            item_count = 0
            while more_data and ((limit is not None) and (item_count < limit)):
                params['next_token'] = next_token
                results = self._cached_query("tweets/search/all", params)
                result_count = results['meta']['result_count']
                if result_count == 0:
                    more_data = False
                    continue
                page = TwitterTwitterProvider._tweets_to_rows(results)
                yield page
                item_count += len(page)
                next_token = results['meta']['next_token'] if 'next_token' in results['meta'] else None
                more_data = next_token is not None
            
            sleep(self.POLITENESS_DELAY)
    
    # sampled_languages just relies on all_items, so if all_items is chunked then we get this for free
    def languages(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 10, **kwargs) -> List[Dict]:
        # use the helper because we need to sample from most recent tweets
        return self._sampled_languages(query, start_date, end_date, limit, **kwargs)
    
    # same as languages
    def words(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
              **kwargs) -> List[Dict]:
        # use the helper because we need to sample from most recent tweets
        return self._sampled_title_words(query, start_date, end_date, limit, **kwargs)

    @CachingManager.cache()
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
        r = self._session.get(TWITTER_API_URL+endpoint, headers=headers, params=params, timeout=self._timeout)
        if r.status_code != 200:
            try:
                raise RuntimeError(r.json()['title'])
            except:
                raise RuntimeError(f"Error code {r.status_code}")
        return r.json()

    @classmethod
    def _add_author_to_tweets(cls, results: Dict) -> None:
        if cls._no_results(results):
            return
        user_id_lookup = {u['id']: u for u in results['includes']['users']}
        for t in results['data']:
            t['author'] = user_id_lookup[t['author_id']]

    @classmethod
    def _tweets_to_rows(cls, results: Dict) -> List:
        TwitterTwitterProvider._add_author_to_tweets(results)
        if cls._no_results(results):
            return []
        return [TwitterTwitterProvider._tweet_to_row(t) for t in results['data']]


    @classmethod
    def _no_results(self, results):
        return results['meta']['result_count'] == 0

    @classmethod
    def _tweet_to_row(cls, item: Dict) -> Dict:
        link = 'https://twitter.com/{}/status/{}'.format(item['author']['username'], item['id'])
        return {
            'media_name': '@'+item['author']['username'],
            'media_url': 'https://twitter.com/{}'.format(item['author']['username']),
            'id': item['id'],
            'title': item['text'],
            'publish_date': dt.datetime.strptime(item['created_at'], TWITTER_DATE_FORMAT),
            'url': link,
            'last_updated': dt.datetime.strptime(item['created_at'], TWITTER_DATE_FORMAT),
            'author': item['author']['name'],
            'language': top_detected(item['text']),  # guess the language cause Twitter oddly doesn't
            'retweet_count': item['public_metrics']['retweet_count'],
            'reply_count': item['public_metrics']['reply_count'],
            'like_count': item['public_metrics']['like_count'],
            'quote_count': item['public_metrics']['quote_count'],
            'content': item['text']
        }

    def normalized_count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime,
                                   **kwargs) -> Dict:
        raise UnsupportedOperationException("Can't search twitter for all tweets in a timeframe")

    def __repr__(self):
        # important to keep this unique among platforms so that the caching works right
        return "TwitterTwitterProvider"

    @classmethod
    def _fix_end_date(cls, orig_end_date: dt.datetime) -> dt.datetime:
        # twitter end dates are NOT inclusive, so we need to add one day here to make it match the general
        # behavior of our system (and UI copywriting)
        # also: can't search results more recent than 10 seconds ago (or something like that)
        return min(orig_end_date + dt.timedelta(days=1),
                   dt.datetime.now() - dt.timedelta(minutes=5))
