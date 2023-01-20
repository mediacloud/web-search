import datetime as dt
from typing import List, Dict
import dateparser
import logging
from waybacknews.searchapi import SearchApiClient
from .language import stopwords_for_language
from .provider import ContentProvider
from util.cache import cache_by_kwargs


class OnlineNewsWaybackMachineProvider(ContentProvider):
    """
    All these endpoints accept a `domains: List[str]` keyword arg.
    """

    DEFAULT_COLLECTION = "mediacloud"

    def __init__(self):
        super(OnlineNewsWaybackMachineProvider, self).__init__()
        self._client = SearchApiClient(self.DEFAULT_COLLECTION)
        self._logger = logging.getLogger(__name__)

    def everything_query(self) -> str:
        return '*'

    @cache_by_kwargs()
    def sample(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 20,
               **kwargs) -> List[Dict]:
        results = self._client.sample(self._assembled_query_str(query, **kwargs), start_date, end_date, **kwargs)
        print(results)
        return self._matches_to_rows(results)

    @cache_by_kwargs()
    def count(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> int:
        return self._client.count(self._assembled_query_str(query, **kwargs), start_date, end_date, **kwargs)

    @cache_by_kwargs()
    def count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> Dict:
        results = self._client.count_over_time(self._assembled_query_str(query, **kwargs), start_date, end_date, **kwargs)
        return {'counts': results}

    @cache_by_kwargs()
    def item(self, item_id: str) -> Dict:
        return self._client.article(item_id)

    def all_items(self, query: str, start_date: dt.datetime, end_date: dt.datetime, page_size: int = 1000, **kwargs):
        for page in self._client.all_articles(self._assembled_query_str(query, **kwargs), start_date, end_date, **kwargs):
            yield self._matches_to_rows(page)

    @cache_by_kwargs()
    def words(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
              **kwargs) -> List[Dict]:
        assembled_query = self._assembled_query_str(query, **kwargs)
        # first figure out the dominant languages, so we can remove appropriate stopwords
        top_languages = self.languages(assembled_query, start_date, end_date, limit=100, **kwargs)
        represented_languages = [i['language'] for i in top_languages if i['ratio'] > 0.1]
        stopwords = []
        for lang in represented_languages:
            try:
                stopwords += stopwords_for_language(lang)
            except RuntimeError:
                pass  # not stopwords for language, just let them all pass through
        # for now just return top terms in article titles
        sample_size = 5000
        results = self._client.terms(assembled_query, start_date, end_date,
                                     self._client.TERM_FIELD_TITLE, self._client.TERM_AGGREGATION_TOP)
        # and clean up results to return
        top_terms = [dict(term=t.lower(), count=c, ratio=c/sample_size) for t, c in results.items()
                     if t.lower() not in stopwords]
        return top_terms

    @cache_by_kwargs()
    def languages(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 10,
                  **kwargs) -> List[Dict]:
        assembled_query = self._assembled_query_str(query, **kwargs)
        matching_count = self.count(assembled_query, start_date, end_date, **kwargs)
        top_languages = self._client.top_languages(assembled_query, start_date, end_date, **kwargs)
        for item in top_languages:
            item['ratio'] = item['value'] / matching_count
            item['language'] = item['name']
            del item['name']
        return top_languages[:limit]

    def sources(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
                **kwargs) -> List[Dict]:
        results = self._client.top_sources(self._assembled_query_str(query, **kwargs), start_date, end_date)
        cleaned_sources = [dict(source=t['name'], count=t['value']) for t in results]
        return cleaned_sources

    @classmethod
    def _assembled_query_str(cls, query: str, **kwargs) -> str:
        domains = kwargs.get('domains', [])
        # need to put all those filters in single query string
        q = query
        if len(domains) > 0:
            q += " AND (domain:({}))".format(" OR ".join(domains))
        return q

    @classmethod
    def _matches_to_rows(cls, matches: List) -> List:
        return [OnlineNewsWaybackMachineProvider._match_to_row(m) for m in matches]

    @classmethod
    def _match_to_row(cls, match: Dict) -> Dict:
        return {
            'media_name': match['domain'],
            'media_url': "http://"+match['domain'],
            'id': match['archive_playback_url'].split("/")[4],  # grabs a unique id off archive.org URL
            'title': match['title'],
            'publish_date': dateparser.parse(match['publication_date']),
            'url': match['url'],
            'language': match['language'],
            'archived_url': match['archive_playback_url'],
            'article_url': match['article_url'],
        }

    def __repr__(self):
        # important to keep this unique among platforms so that the caching works right
        return "OnlineNewsWaybackMachineProvider"
