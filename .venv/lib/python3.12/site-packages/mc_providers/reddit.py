from collections import defaultdict
import datetime as dt
import requests
from typing import List, Dict, Optional
import logging

from .errors import deprecated
from .provider import ContentProvider, MC_DATE_FORMAT
from .cache import CachingManager
from .language import top_detected

REDDIT_PUSHSHIFT_URL = "https://api.pushshift.io"
SUBMISSION_SEARCH_URL = "{}/reddit/submission/search".format(REDDIT_PUSHSHIFT_URL)
DEFAULT_TIMEOUT = 60


@deprecated
class RedditPushshiftProvider(ContentProvider):

    def __init__(self, timeout: int = None, caching: Optional[bool] = True):
        super(RedditPushshiftProvider, self).__init__(caching)
        self._logger = logging.getLogger(__name__)
        self._session = requests.Session()  # better performance to put all HTTP through this one object
        self._timeout = timeout or DEFAULT_TIMEOUT

    def everything_query(self) -> str:
        return '*'

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
                                              size=limit,  sort='score', order='desc', **kwargs)
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
                                              size=0, track_total_hits=True, **kwargs)
        # self._logger.debug(data)
        return data['metadata']['es']['hits']['total']['value']

    def count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> Dict:
        data = self._cached_submission_search(q=query,
                                              start_date=start_date, end_date=end_date,
                                              size=0,
                                              calendar_histogram='day', **kwargs)
        # self._logger.debug(data)
        buckets = data['metadata']['es']['aggregations']['calendar_histogram']['buckets']
        to_return = []
        for item in buckets:
            epoch_time = item['key']/1000
            to_return.append({
                'date': dt.datetime.fromtimestamp(epoch_time),
                'timestamp': epoch_time,
                'count': item['doc_count']
            })
        return {'counts': to_return}

    def all_items(self, query: str, start_date: dt.datetime, end_date: dt.datetime, page_size: int = 250, **kwargs) -> Dict:
        # don't change the 250 (changing page size seems to be unsupported)
        last_date = start_date
        more_data = True
        item_count = 0
        limit = kwargs['limit'] if 'limit' in kwargs else None
        while more_data and (limit and item_count < limit):
            # page through by time
            page = self._cached_submission_search(q=query, start_date=last_date, end_date=end_date,
                                                  size=page_size, sort='created_utc', order='asc',
                                                  **kwargs)
            cleaned_data = [self._submission_to_row(item) for item in page['data']]
            yield cleaned_data
            item_count += len(cleaned_data)
            more_data = len(page['data']) >= (page_size-10)
            last_date = self._to_date(page['data'][-1]['created_utc']) if more_data else None

    def languages(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 10, **kwargs) -> List[Dict]:
        # use the helper because we need to sample from most recent tweets
        return self._sampled_languages(query, start_date, end_date, limit, **kwargs)

    def words(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
              **kwargs) -> List[Dict]:
        # use the helper because we need to sample from most recent tweets
        return self._sampled_title_words(query, start_date, end_date, limit, **kwargs)

    @CachingManager.cache()
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
            params['after'] = int(start_date.timestamp())
            params['before'] = int(end_date.timestamp())
        params['metadata'] = 'true'
        # and now add in any other arguments they have sent in
        params.update(kwargs)
        r = self._session.get(SUBMISSION_SEARCH_URL, headers=headers, params=params, timeout=self._timeout)
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
            'id': item['id'],
            'title': item['title'],
            'publish_date': RedditPushshiftProvider._to_date(item['created_utc']).strftime(MC_DATE_FORMAT),
            'media_link': item['url'],
            'score': item['score'],
            'last_updated': RedditPushshiftProvider._to_date(item['updated_utc']).strftime(MC_DATE_FORMAT) if 'updated_utc' in item else None,
            'author': item['author'],
            'subreddit': item['subreddit'],
            'thumbnail_url': item['thumbnail'],
            'is_video': item['is_video'],
            'linked_domain': item['domain'],
            'over_18': item['over_18'],
            'language': top_detected(item['title'])  # Reddit doesn't tell us the language, so guess it
        }

    @classmethod
    def _to_date(cls, reddit_timestamp: int) -> dt.datetime:
        return dt.datetime.fromtimestamp(reddit_timestamp)

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
