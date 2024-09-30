"""
Interface to rss-fetcher API.

Not tied to Django/web-search infrastructure
so can be put into a repo of its own.
"""

import logging
from typing import Any, Type

# PyPI
import requests.auth
import requests.sessions

logger = logging.getLogger(__name__)

class RssFetcherError(Exception):
    """class for RssFetcherApi error"""

class RssFetcherApi:
    def __init__(self, url: str, user: str | None, password: str | None):
        self._session = requests.sessions.Session()
        self._url = url
        self._user = user
        self._pass = password

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._session.close()

    def _request(self, method: str, path: str) -> Any:
        if self._user and self._pass:
            auth = requests.auth.HTTPBasicAuth(self._user, self._pass)
        else:
            auth = None

        hdrs = { 'User-Agent': __name__ }

        url = f'{self._url}/api/{path}'
        response = self._session.request(method, url, auth=auth, headers=hdrs)

        logger.debug(f"{method} {url}: status: {response.status_code} data: {len(response.text)} bytes")
        if response.status_code != 200:
            raise RssFetcherError(f"HTTP {url}: {response.status_code} {response.reason}")

        j = response.json()
        status = j.get('status')
        if status != 'OK': 
            raise RssFetcherError(f"status {status}")
       # XXX check j['version']?

        return j.get('results')

    def _get(self, path: str) -> Any:
        return self._request('GET', path)

    def _post(self, path: str) -> Any:
        return self._request('POST', path)

    # helpers to check return type

    def _get_list(self, path: str) -> list:
        r = self._get(path)
        if not isinstance(r, list):
            raise RssFetcherError(f"{path} expected list got {type(r).__name__}")
        return r

    def _get_dict(self, path: str) -> dict:
        r = self._get(path)
        if not isinstance(r, dict):
            raise RssFetcherError(f"{path} expected dict got {type(r).__name__}")
        return r

    ################ feeds methods

    def feed(self, feed_id: int) -> dict[str, Any]:
        """return single dict for a rss-fetcher Feeds row"""
        return self._get_dict(f"feeds/{feed_id}")

    def feed_history(self, feed_id: int) -> list[dict[str, Any]]:
        """return list of dicts for rss-fetcher FetchHistory rows"""
        # NOTE: takes ?limit=N
        return self._get_list(f"feeds/{feed_id}/history")

    def feed_fetch_soon(self, feed_id: int) -> int:
        """
        POST request to fetch a feed soon;
        returns count of updated feeds (0 or 1)
        """
        return int(self._post(f"feeds/{feed_id}/fetch-soon"))

    def feed_stories(self, feed_id: int) -> list[dict[str, Any]]:
        """
        GET request to fetch recent stories fetched from feed
        returns list of Dict
        """
        return self._get_list(f"feeds/{feed_id}/stories")

    ################ sources methods

    def source_feeds(self, source_id: int) -> list[dict[str, Any]]:
        """return list dicts of rss-fetcher Feeds rows"""
        return self._get_list(f"sources/{source_id}/feeds")

    def source_fetch_soon(self, source_id: int):
        """
        POST request to fetch all source feeds soon.
        returns count of updated feeds
        """
        return int(self._post(f"sources/{source_id}/fetch-soon"))

    def source_stories(self, source_id: int) -> list[dict[str, Any]]:
        """
        GET request to fetch recent stories fetched from source feeds
        returns list of Dict
        """
        return self._get_list(f"sources/{source_id}/stories")

    def source_stories_fetched_by_day(self, source_id: int) -> list[dict[str, Any]]:
        """
        GET request to fetch counts of recent stories by fetched_at date
        returns list of Dict: {"date": "YYYY-MM-DD", "count": N}
        """
        return self._get_list(f"sources/{source_id}/stories/fetched-by-day")

    def source_stories_published_by_day(self, source_id: int) -> list[dict[str, Any]]:
        """
        GET request to fetch counts of recent stories by published_at date
        returns list of Dict: {"date": "YYYY-MM-DD", "count": N}
        """
        return self._get_list(f"sources/{source_id}/stories/published-by-day")

    ################ stories methods

    def stories_fetched_by_day(self) -> list[dict[str, Any]]:
        """
        returns list of dict w/ 'date', 'type', 'count'
        """
        return self._get_list("stories/fetched-by-day")

    def stories_published_by_day(self) -> list[dict[str, Any]]:
        """
        returns list of dict w/ 'date', 'type', 'count'
        """
        return self._get_list("stories/published-by-day")

    def stories_by_source(self) -> list[tuple[int,float]]:
        """return list of tuples (source_id, stories_per_day)"""
        # dict w/ days, sources
        r = self._get_dict("stories/by-source")
        days = r.get('days')
        if not days:
            return []
        return [(d.get('sources_id'), d.get('count')/days)
                for d in r.get('sources', [])]

if __name__ == '__main__':
    # test run via:
    # venv/bin/python -m backend.sources.rss_fetcher_api
    # from mcweb directory
    import os

    logging.basicConfig(level=logging.DEBUG)

    DUMP = False                # XXX take command line arg/option!

    url = os.environ["RSS_FETCHER_URL"]
    user = os.environ["RSS_FETCHER_USER"]
    password = os.environ["RSS_FETCHER_PASS"]

    with RssFetcherApi(url, user, password) as rss:
        # tested against staging-rss-fetcher.ifill.angwin:

        SRC = 1                 # NYT
        FEED = 10               # NYT Baseball
        FURL = 'http://www.nytimes.com/services/xml/rss/nyt/Baseball.xml'

        ################ feed

        f = rss.feed(FEED)
        if DUMP: print(f)
        assert f['url'] == FURL

        fh = rss.feed_history(FEED)
        assert len(fh) > 10

        s = rss.feed_stories(FEED)
        if DUMP: print("fs", s)
        assert len(s) > 1

        #rss.feed_fetch_soon(FEED) # should return 0 or 1

        ################ source

        f = rss.source_feeds(SRC)
        assert len(f) > 10

        s = rss.source_stories(SRC)
        if DUMP: print("ss", s)
        assert len(s) > 10

        s = rss.source_stories_published_by_day(SRC)
        if DUMP: print("ss", s)
        assert len(s) > 10

        s = rss.source_stories_fetched_by_day(SRC)
        if DUMP: print("ss", s)
        assert len(s) > 10

        ################ stories

        s = rss.stories_fetched_by_day()
        assert len(s) > 2

        s = rss.stories_published_by_day()
        assert len(s) > 2

        s = rss.stories_by_source()
        assert len(s) > 10
        if DUMP:
            for row in s:
                print(row[0], round(row[1]*7))

        # print("soon:", rss.source_fetch_soon(SRC))  # returns number of feeds updated
