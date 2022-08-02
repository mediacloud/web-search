from collections import defaultdict
import datetime as dt
import requests
from typing import List, Dict
import logging

from .provider import ContentProvider, MC_DATE_FORMAT
from util.cache import cache_by_kwargs

REDDIT_PUSHSHIFT_URL = "https://api.pushshift.io"
SUBMISSION_SEARCH_URL = "{}/reddit/search/submissions".format(REDDIT_PUSHSHIFT_URL)

NEWS_SUBREDDITS = ['politics', 'worldnews', 'news', 'conspiracy', 'Libertarian', 'TrueReddit', 'Conservative', 'offbeat']


class RedditPushshiftProvider(ContentProvider):

    def __init__(self):
        super(RedditPushshiftProvider, self).__init__()
        self._logger = logging.getLogger(__name__)

    def sample(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 20, **kwargs) -> List[Dict]:
        """
        Return a list of top submissions matching the query.
        :param query:
        :param start_date:
        :param end_date:
        :param limit:
        :param kwargs: Options: 'subreddits': List[str]
        :return:
        """
        data = self._cached_submission_search(q=query,
                                              start_date=start_date, end_date=end_date,
                                              limit=limit,  sort='score', order='desc', **kwargs)
        cleaned_data = [self._submission_to_row(item) for item in data['data'][:limit]]
        return cleaned_data

    def count(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> int:
        """
        Count how reddit sumissions match the query.
        :param query:
        :param start_date:
        :param end_date:
        :param kwargs: Options: 'subreddits': List[str]
        :return:
        """
        data = self._cached_submission_search(q=query,
                                              start_date=start_date, end_date=end_date,
                                              limit=0, track_total_hits=True, **kwargs)
        return data['metadata']['es']['hits']['total']['value']

    def count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> Dict:
        """
        How many reddit submissions over time match the query.
        :param query:
        :param start_date:
        :param end_date:
        :param kwargs: Options: 'subreddits': List[str], period: str (default '1d')
        :return:
        """
        period = kwargs['period'] if 'period' in kwargs else '1d'
        data = self._cached_submission_search(q=query,
                                              start_date=start_date, end_date=end_date,
                                              calendar_histogram='day')
        # make the results match the format we use for stories/count in the Media Cloud API
        results = []
        for d in data['metadata']['es']['aggregations']['calendar_histogram']['buckets']:
            results.append({
                'date': dt.datetime.fromtimestamp(d['key']/1000),
                'timestamp': d['key']/1000,
                'count': d['doc_count'],
            })
        return {'counts': results}

    @cache_by_kwargs()
    def _cached_submission_search(self, query: str = None, start_date: dt.datetime = None, end_date: dt.datetime = None,
                                  **kwargs) -> Dict:
        """
        Run a generic query against Pushshift.io to retrieve Reddit data
        :param start_date:
        :param end_date:
        :param subreddits:
        :param kwargs: any other params you want to send over the Pushshift as part of your query (sort, sort_type,
        limit, aggs, etc)
        :return:
        """
        headers = {'Content-type': 'application/json'}
        params = defaultdict()
        if query is not None:
            params['q'] = query
        if 'subreddits' in kwargs:
            params['subreddit'] = ",".join(kwargs['subreddits'])
        if (start_date is not None) and (end_date is not None):
            params['since'] = int(start_date.timestamp())
            params['until'] = int(end_date.timestamp())
        # and now add in any other arguments they have sent in
        params.update(kwargs)
        r = requests.get(SUBMISSION_SEARCH_URL, headers=headers, params=params)
        # temp = r.url # useful assignment for debugging investigations
        return r.json()

    @classmethod
    def _submission_to_row(cls, item: Dict) -> Dict:
        """
        turn a Reddit submission into something that looks like a Media Cloud story
        :param item:
        :return:
        """
        return {
            'media_name': '/r/{}'.format(item['subreddit']),
            'media_url': 'https://reddit.com/r/{}'.format(item['subreddit']),
            'url': 'https://reddit.com/'+item['permalink'],
            'stories_id': item['id'],
            'content': item['title'],
            'publish_date': dt.datetime.fromtimestamp(item['created_utc']).strftime(MC_DATE_FORMAT),
            'media_link': item['url'],
            'score': item['score'],
            'last_updated': dt.datetime.fromtimestamp(item['updated_utc']).strftime(MC_DATE_FORMAT) if 'updated_utc' in item else None,
            'author': item['author'],
            'subreddit': item['subreddit']
        }

    @classmethod
    def _sanitize_url_for_reddit(cls, url: str) -> str:
        """
        Naive normalization, but works OK
        :return:
        """
        return url.split('?')[0]

    def _everything_query(self) -> str:
        return ''

    def __repr__(self):
        # important to keep this unique among platforms so that the caching works right
        return "RedditPushshiftProvider"
