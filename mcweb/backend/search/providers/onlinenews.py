import datetime as dt
from typing import List, Dict
import dateparser
import logging
from mediacloud.api import MediaCloud
import mcmetadata
from django.apps import apps
from waybacknews.searchapi import SearchApiClient

from .provider import ContentProvider
from util.cache import cache_by_kwargs


class OnlineNewsMediaCloudProvider(ContentProvider):
    """
    All these endpoints accept `tags_ids: List[int]` and `media_ids: List[int]` keyword args.
    """

    def __init__(self, api_key):
        super(OnlineNewsMediaCloudProvider, self).__init__()
        self._logger = logging.getLogger(__name__)
        self._api_key = api_key
        self._mc_client = MediaCloud(api_key)
        self._mc_client.TIMEOUT_SECS = 300  # give backend 5 mins to responsd

    def everything_query(self) -> str:
        return '*'

    @cache_by_kwargs()
    def sample(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 20,
               **kwargs) -> List[Dict]:
        """
        Return a list of stories matching the query.
        :param query:
        :param start_date:
        :param end_date:
        :param limit:
        :param kwargs: sources and collections lists
        :return:
        """
        q, fq = self._format_query(query, start_date, end_date, **kwargs)
        story_list = self._mc_client.storyList(q, fq, rows=limit)
        return self._matches_to_rows(story_list)

    @cache_by_kwargs()
    def count(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> int:
        """
        Count how many verified tweets match the query.
        :param query:
        :param start_date:
        :param end_date:
        :param kwargs: sources and collections lists
        :return:
        """
        q, fq = self._format_query(query, start_date, end_date, **kwargs)
        story_count_result = self._mc_client.storyCount(q, fq)
        return story_count_result['count']

    @cache_by_kwargs()
    def count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> List[Dict]:
        """
        How many verified tweets over time match the query.
        :param query:
        :param start_date:
        :param end_date:
        :param kwargs: sources and collections lists
        :return:
        """
        q, fq = self._format_query(query, start_date, end_date, **kwargs)
        story_count_result = self._mc_client.storyCount(q, fq, split=True)
        return story_count_result

    @cache_by_kwargs()
    def item(self, item_id: str) -> Dict:
        story = self._mc_client.story(item_id)
        return self._match_to_row(story)

    def all_items(self, query: str, start_date: dt.datetime, end_date: dt.datetime, page_size: int = 1000, **kwargs):
        q, fq = self._format_query(query, start_date, end_date, **kwargs)
        last_id = 0
        more_stories = True
        stories = []
        while more_stories:
            page = self._matching_page(q, fq, last_processed_stories_id=last_id, page_size=page_size,
                                       sort='processed_stories_id')
            yield page
            if len(page) == 0:
                more_stories = False
            else:
                stories += page
                last_id = page[-1]['processed_stories_id']

    @cache_by_kwargs()
    def _matching_page(self, q: str, fq: str, last_processed_stories_id: str, page_size: int, sort: str):
        page = self._mc_client.storyList(q, fq, last_processed_stories_id=last_processed_stories_id, rows=page_size,
                                         sort=sort)
        return page

    @cache_by_kwargs()
    def words(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
              **kwargs) -> List[Dict]:
        """
        Get the top words based on a sample
        :param query:
        :param start_date:
        :param end_date:
        :param limit:
        :param kwargs: sources and collections lists
        :return:
        """
        q, fq = self._format_query(query, start_date, end_date, **kwargs)
        top_words = self._mc_client.wordCount(q, fq)[:limit]
        return top_words

    @cache_by_kwargs()
    def tags(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> List[Dict]:
        q, fq = self._format_query(query, start_date, end_date, **kwargs)
        tags_sets_id = kwargs.get('tags_sets_id', None)
        sample_size = kwargs.get('sample_size', None)
        top_tags = self._mc_client.storyTagCount(q, fq, tag_sets_id=tags_sets_id, limit=sample_size, http_method='POST')
        return top_tags

    @classmethod
    def _format_query(cls, query: str, start_date: dt.datetime, end_date: dt.datetime,
                      **kwargs) -> (str, str):
        """
        Take all the query params and return q and fq suitable for a media cloud solr-syntax query
        :param query:
        :param start_date:
        :param end_date:
        :param kwargs: sources and collections
        :return:
        """
        q = cls._query_from_parts(query, kwargs.get('media_ids', []), kwargs.get('tags_ids', []))
        fq = MediaCloud.dates_as_query_clause(start_date, end_date)
        return q, fq

    @classmethod
    def _query_from_parts(cls, query: str, media_ids: List[int], tag_ids: List[int]) -> str:
        query = '({})'.format(query)
        if len(media_ids) > 0 or (len(tag_ids) > 0):
            clauses = []
            # add in the media sources they specified
            if len(media_ids) > 0:  # this format is a string of media_ids
                query_clause = "media_id:({})".format(" ".join([str(m) for m in media_ids]))
                clauses.append(query_clause)
            # add in the collections they specified
            if len(tag_ids) > 0:  # this format is a string of tags_id_medias
                query_clause = "tags_id_media:({})".format(" ".join([str(m) for m in tag_ids]))
                clauses.append(query_clause)
            # now add in any addition media query clauses (get OR'd together)
            if len(clauses) > 0:
                query += " AND ({})".format(" OR ".join(clauses))
        return query

    def __repr__(self):
        # important to keep this unique among platforms so that the caching works right
        return "OnlineNewsMediaCloudProvider"

    @classmethod
    def _matches_to_rows(cls, matches: List) -> List:
        return [OnlineNewsMediaCloudProvider._match_to_row(m) for m in matches]

    @classmethod
    def _match_to_row(cls, match: Dict) -> Dict:
        return {
            'media_name': mcmetadata.urls.canonical_domain(match['url']),
            'media_url': match['media_url'],
            'id': match['stories_id'],
            'title': match['title'],
            'publish_date': dateparser.parse(match['publish_date']),
            'url': match['url'],
            'language': match['language'],
        }


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

    def words(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
              **kwargs) -> List[Dict]:
        results = self._client.terms(self._assembled_query_str(query, **kwargs), start_date, end_date,
                                     self._client.TERM_FIELD_TITLE, self._client.TERM_AGGREGATION_TOP)
        return [dict(term=t, count=c) for t, c in results.items()]

    @classmethod
    def _assembled_query_str(cls, query: str, **kwargs) -> str:
        # turn the domains into a filter
        domains = kwargs.get('domains', [])
        domain_clause = ""
        if len(domains) > 0:
            domain_clause += "domain:({})".format(" OR ".join(domains))
        # turn the url_search_string clauses into a filter, if any
        filters = kwargs.get('filters', [])
        filter_clause = ""
        if len(filters) > 0:
            filter_clause += " OR ".join(filters)
        # now assemble both
        q = query
        if (len(domain_clause) > 0) and (len(filter_clause) > 0):
            q += f" AND (({domain_clause}) OR ({filter_clause}))"
        elif len(domain_clause) > 0:
            q += f" AND ({domain_clause})"
        elif len(filter_clause) > 0:
            q += f" AND ({filter_clause})"
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
        }

    def __repr__(self):
        # important to keep this unique among platforms so that the caching works right
        return "OnlineNewsWaybackMachineProvider"
