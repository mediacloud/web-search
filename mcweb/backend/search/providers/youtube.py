import datetime as dt
from typing import List, Dict
import logging
import dateutil.parser
import requests

from .provider import ContentProvider, MC_DATE_FORMAT
from .exceptions import UnsupportedOperationException
from util.cache import cache_by_kwargs

# 2014-09-21T00:00:00Z
YT_DATE_FORMAT = "%Y-%m-%dT%H:%M:%SZ"

YT_SEARCH_API_URL = 'https://www.googleapis.com/youtube/v3/search'

#YT_SEARCH_API_URL = 'https://content-youtube.googleapis.com/youtube/v3/search'
YT_SEARCH_HEADERS = {
    "x-origin": "https://explorer.apis.google.com",
    "x-referer": "https://explorer.apis.google.com",
}


class YouTubeYouTubeProvider(ContentProvider):
    """
    Get matching YouTube videos
    """

    def __init__(self, api_key):
        super(YouTubeYouTubeProvider, self).__init__()
        self._logger = logging.getLogger(__name__)
        self._api_key = api_key

    def count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> Dict:
        raise UnsupportedOperationException("The YouTube API doesn't support counts over time")

    def normalized_count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime,
                                   **kwargs) -> Dict:
        raise UnsupportedOperationException("Can't search YouTube API for all videos in a timeframe")

    def count(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> int:
        """
        Count how many videos match the query.
        :param query:
        :param start_date:
        :param end_date:
        :param kwargs:
        :return:
        """
        results = self._fetch_results_from_api(query, start_date, end_date)
        total = results['pageInfo']['totalResults']
        if total == 1000000:
            raise UnsupportedOperationException("The YouTube API doesn't provide exact counts when there are more "
                                                "than 1 million matches")
        return total

    def sample(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 20,
               **kwargs) -> List[Dict]:
        """
        :param query:
        :param start_date:
        :param end_date:
        :param limit:
        :param kwargs:
        :return:
        """
        results = self._fetch_results_from_api(query, start_date, end_date, limit, order="viewCount")
        # make sure we pull out only the videos (even through we requested only videos
        videos = []
        for search_result in results['items']:
            if search_result["id"]["kind"] == "youtube#video":
                videos.append(search_result)
        # format them like stories to return
        stories = [self._content_to_row(v) for v in videos]
        return stories

    def languages(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 10, **kwargs) -> List[Dict]:
        raise UnsupportedOperationException("We can't sample enough videos quickly to show top languages in video titles.")

    def words(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
              **kwargs) -> List[Dict]:
        raise UnsupportedOperationException("We can't sample enough videos quickly to show top words in video titles.")

    @classmethod
    def _content_to_row(cls, item):
        try:
            publish_date = dateutil.parser.parse(item['snippet']['publishedAt']).strftime(MC_DATE_FORMAT)
        except ValueError:
            publish_date = None
        except KeyError:
            publish_date = None
        return {
            'id': item['id']['videoId'],
            'author': item['snippet']['channelTitle'],
            'publish_date': publish_date,
            'title': item['snippet']['title'],
            'media_name': item['snippet']['channelTitle'],
            'media_url': "https://www.youtube.com/channel/{}".format(item['snippet']['channelId']),
            'url': "https://www.youtube.com/watch?v={}".format(item['id']['videoId'])
        }

    @cache_by_kwargs()
    def _fetch_results_from_api(self, query: str, start_date: dt.datetime, end_date: dt.datetime,
                                limit: int = 20, order: str = "relevance", page_token: str = None) -> dict:
        # default returns items sorted by relevant
        params = {
            'key': self._api_key,
            'q': query,
            'publishedAfter': start_date.strftime(YT_DATE_FORMAT),
            'publishedBefore': end_date.strftime(YT_DATE_FORMAT),
            'type': 'video',
            'part': 'snippet, id',
            'maxResults': limit,
            'order': order,
            'pageToken': page_token,
        }
        response = requests.get(YT_SEARCH_API_URL, headers=YT_SEARCH_HEADERS, params=params)
        return response.json()

    def __repr__(self):
        # important to keep this unique among platforms so that the caching works right
        return "YouTubeYouTubeProvider"
