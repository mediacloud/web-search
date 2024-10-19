import datetime as dt
from typing import List, Dict, Optional
import logging
import requests
import ciso8601
import time


API_VERSION = "v1"  # the API access URL is versioned for future compatability and maintenance

# These are all the characters used in elastic search queries, so they should NOT be included in your search str
ALL_RESERVED_CHARS = ['+', '\\', '-', '!', '(', ')', ':', '^', '[', ']', '"', '{', '}', '~', '*', '?', '|', '&', '/']
# However, most query strings are using these characters on purpose, so let's only automatically escape some of them
RARE_RESERVED_CHARS = ['/']


def sanitize_query(query: str, reserved_char_list: Optional[List[str]] = None) -> str:
    """
    Make sure we properly escape any reserved characters in an elastic search query
    @see https://www.elastic.co/guide/en/elasticsearch/reference/7.17/query-dsl-query-string-query.html#_reserved_characters
    :param query: a full query string
    :param reserved_char_list: characters that need escaping
    :return:
    """
    reserved_chars = reserved_char_list if reserved_char_list else RARE_RESERVED_CHARS
    sanitized = ''
    for char in query:
        if char in reserved_chars:
            sanitized += '\\%s' % char
        else:
            sanitized += char
    return sanitized


def dict_to_list(data: Dict) -> List[Dict]:
    """
    The API returns dicts, but that isn't very restful nor the current standard approach to user-friendly JSON.
    This utility method converts tht into a list of dicts.
    """
    return [{'name': k, 'value': v} for k, v in data.items()]


class MCSearchApiClient:

    API_BASE_URL = "https://news-search-api.tarbell.mediacloud.org/{}/".format(API_VERSION)
    TIMEOUT_SECS = 30

    # constants used when requesting top terms
    TERM_FIELD_TITLE = "article_title"
    TERM_FIELD_TEXT_CONTENT = "text_content"
    TERM_AGGREGATION_TOP = "top"
    TERM_AGGREGATION_SIGNIFICANT = "significant"
    TERM_AGGREGATION_RARE = "rare"

    def __init__(self, collection: str, api_base_url: str = None):
        """
        :param collection: the archive support multiple collections of stories so you have to pass in the
                           name of the collection you want to search against
        :param api_base_url: advanced optional arg: let you override the hard-coded base URL
        """
        self._collection = collection
        if api_base_url:
            self.API_BASE_URL = api_base_url
        self._session = requests.Session()  # better performance to put all HTTP through this one object
        self._logger = logging.getLogger(__name__)

    def sample(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> List[Dict]:
        results = self._overview_query(query, start_date, end_date, **kwargs)
        if self._is_no_results(results):
            return []
        return results['matches']

    def top_sources(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> List[Dict]:
        results = self._overview_query(query, start_date, end_date, **kwargs)
        if self._is_no_results(results):
            return []
        return util.dict_to_list(results['topdomains'])

    def top_languages(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> List[Dict]:
        results = self._overview_query(query, start_date, end_date, **kwargs)
        if self._is_no_results(results):
            return []
        return util.dict_to_list(results['toplangs'])

    @staticmethod
    def _is_no_results(results: Dict) -> bool:
        return ('matches' not in results) and ('detail' in results) and (results['detail'] == 'No results found!')

    def count(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> int:
        results = self._overview_query(query, start_date, end_date, **kwargs)
        if self._is_no_results(results):
            return 0
        return results['total']

    def count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> List:
        results = self._overview_query(query, start_date, end_date, **kwargs)
        if self._is_no_results(results):
            return []
        data = results['dailycounts']
        to_return = []
        # transform to list of dicts for easier use
        for day_date, day_value in data.items():  # date is in 'YYYY-MM-DD' format
            day = ciso8601.parse_datetime(day_date)
            to_return.append({
                'date': day,
                'timestamp': day.timestamp(),
                'count': day_value,
            })
        return to_return

    @staticmethod
    def _date_query_clause(start_date: dt.datetime, end_date: dt.datetime) -> str:
        return "publication_date:[{} TO {}]".format(start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"))

    def _overview_query(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> Dict:
        params = {"q": "{} AND {}".format(query, self._date_query_clause(start_date, end_date))}
        params.update(kwargs)
        results, _ = self._query("{}/search/overview".format(self._collection), params, method='POST')
        return results

    def article(self, article_id: str) -> Dict:
        # you can extract article_ids from the `article_url` property
        results, _ = self._query("{}/article/{}".format(self._collection, article_id), method='GET')
        return results

    def all_articles(self, query: str, start_date: dt.datetime, end_date: dt.datetime, page_size: int = 1000, **kwargs):
        """
        @return: a generator that yeilds lists of articles, grouped by page.
        """
        params = {"q": "{} AND {}".format(query, self._date_query_clause(start_date, end_date))}
        params.update(kwargs)
        more_pages = True
        next_page_token = None
        while more_pages:
            page, next_page_token = self.paged_articles(query, start_date, end_date, page_size, **kwargs,
                                                        pagination_token=next_page_token)
            if self._is_no_results(page):
                yield []
            else:
                yield page
            # check if there is a link to the next page
            more_pages = False
            if next_page_token:
                more_pages = True

    def paged_articles(self, query: str, start_date: dt.datetime, end_date: dt.datetime,
                       page_size: Optional[int] = 1000,  expanded: bool = False,
                       pagination_token: Optional[str] = None, **kwargs) -> tuple[List[Dict], Optional[str]]:
        """
        @return: one page of stories
        """
        params = {"q": "{} AND {}".format(query, self._date_query_clause(start_date, end_date))}
        if expanded:
            params['expanded'] = 1
        if pagination_token:
            params['resume'] = pagination_token
        params.update(kwargs)
        page, response = self._query("{}/search/result".format(self._collection), params, method='POST')
        if self._is_no_results(page):
            return [], None
        return page, response.headers.get('x-resume-token')

    def terms(self, query: str, start_date: dt.datetime, end_date: dt.datetime, field: str, aggregation: str,
              **kwargs) -> Dict:
        params = {"q": "{} AND {}".format(query, self._date_query_clause(start_date, end_date))}
        params.update(kwargs)
        results, _ = self._query("{}/terms/{}/{}".format(self._collection, field, aggregation), params, method='GET')
        return results

    def _query(self, endpoint: str, params: Dict = None, method: str = 'GET'):
        """
        Centralize making the actual queries here for easy maintenance and testing of HTTP comms
        """
        if params and ('domains' in params):  # remove domains param that might be dangling
            del params['domains']
        if params and ('q' in params):
            params['q'] = sanitize_query(params['q'])
        endpoint_url = self.API_BASE_URL+endpoint
        start = time.time()
        if method == 'GET':
            r = self._session.get(endpoint_url, params=params, timeout=self.TIMEOUT_SECS)
        elif method == 'POST':
            r = self._session.post(endpoint_url, json=params, timeout=self.TIMEOUT_SECS)
        else:
            raise RuntimeError("Unsupported method of '{}'".format(method))
        duration = time.time() - start

        if r.status_code == 504:
            raise RuntimeError("API returned 504 Gateway Timeout after {} secs. Client timeout: {},"
                                "Endpoint: {}, Params: {}".format(duration, self.TIMEOUT_SECS, endpoint_url, params))

        if r.status_code >= 500:
            raise RuntimeError("API Server Error {}: a bad query string could have triggered this. Endpoint: {},"
                               " Params: {}".format(r.status_code, endpoint_url, params))
        
        return r.json(), r