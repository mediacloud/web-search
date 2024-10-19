"""
tools to perform a full crawl of a site
"""

import logging
import time
from typing import Callable, NamedTuple, cast

# PyPI
from mcmetadata.webpages import MEDIA_CLOUD_USER_AGENT
from requests.exceptions import RequestException

# local package
from . import discover, parser

logger = logging.getLogger(__name__)


def _canurl(url: str) -> str:
    """
    replace with URL canonicalization?
    """
    return url


FETCH_EXCEPTIONS = (RequestException,)
Saver = Callable[[parser.Urlset], None]


class Crawler:
    """
    enscapsulate state for crawling a site.
    meant to be pickleable (no open files/sessions)

    visits pages breadth first.
    """

    def __init__(self, home_page: str, saver: Saver, user_agent: str):
        if not home_page.endswith("/"):
            home_page += "/"
        self.home_page = home_page
        self.saver = saver
        self.user_agent = user_agent

        self.news_discoverer = discover.NewsDiscoverer(user_agent)
        self.to_visit: list[str] = []
        self.seen: set[str] = set()
        self.state_processor = None
        self.get_robots = True

    def _add_url(self, url: str, home_page: str | None = None) -> None:
        """
        `url` may be complete URL (if `home_page` is None),
        or path to append to `home_page`
        checks if already seen before adding to `to_visit` list
        """
        if home_page:
            url = home_page + url
        canurl = _canurl(url)
        if canurl not in self.seen:
            logger.info("adding %s", url)
            self.seen.add(canurl)
            self.to_visit.append(url)

    def _add_list(self, url_list: list[str], add_home_page: bool) -> None:
        """
        add list of urls to visit
        if `add_home_page` is True, prepend `home_page` to each url
        """
        for url in url_list:
            if add_home_page:
                url = self.home_page + url
            self._add_url(url)

    def visit_one(self) -> bool:
        """
        visit one page, returns True while more work to be done
        """
        if self.get_robots:
            # initial state: seed visit_list with pages in robots.txt
            # and "well known" paths
            logger.info("getting robots.txt")
            try:
                self._add_list(
                    self.news_discoverer.robots_sitemaps(self.home_page), False
                )
            except FETCH_EXCEPTIONS:
                pass
            self._add_list(discover._UNPUBLISHED_SITEMAP_INDEX_PATHS, True)
            self._add_list(discover._UNPUBLISHED_GNEWS_SITEMAP_PATHS, True)

            self.get_robots = False
            # robots.txt counts as a visit
            # so don't visit any pages
        else:
            url = self.to_visit.pop(0)
            logger.info("getting %s", url)
            # fetch and parse page:
            try:
                sitemap = self.news_discoverer.sitemap_get(url)
            except FETCH_EXCEPTIONS:
                sitemap = None

            if sitemap:  # fetched and parsed ok
                smt = sitemap["type"]
                if smt == "index":
                    logger.info("%s: index", url)
                    index = cast(parser.Index, sitemap)
                    for suburl in index["sub_sitemap_urls"]:
                        self._add_url(suburl)
                elif smt == "urlset":
                    logger.info("%s: urlset", url)
                    urlset = cast(parser.Urlset, sitemap)
                    self.saver(urlset)
                else:
                    logger.warning("%s: unknown sitemap type %s", url, smt)
            # end not _get_robots
        return len(self.to_visit) > 0


def full_crawl_gnews_urls(home_page: str, sleep_time: float = 1.0) -> list[str]:
    """
    Returns list of sitemap urlsets with google_news_tags.

    If you're spending the time to do a full crawl, you might consider
    full_crawl_urlsets, which returns all urlsets along with
    gnewsiness and number of entries!
    """
    results = []

    def saver(urlset: parser.Urlset) -> None:
        if urlset["google_news_tags"]:
            url = urlset["url"]
            logger.info("*** SAVING %s ***", url)
            results.append(url)

    crawler = Crawler(home_page, saver, MEDIA_CLOUD_USER_AGENT)
    while crawler.visit_one():
        logger.info("sleeping %.3f", sleep_time)
        time.sleep(sleep_time)

    return results


class UrlsetInfo(NamedTuple):
    url: str
    size: int
    gnews: bool
    entries: int
    lastlastmod: str | None


def full_crawl_urlsets(home_page: str, sleep_time: float = 1.0) -> list[UrlsetInfo]:
    """
    Returns list of sitemap urlset summaries using Crawler class
    """
    results = []

    def saver(urlset: parser.Urlset) -> None:

        url = urlset["url"]
        lastlastmod = ""
        for pg in urlset["pages"]:
            lm = pg.get("lastmod")
            if lm and lm > lastlastmod:
                lastlastmod = lm

        ui = UrlsetInfo(
            url,
            urlset["size"],
            urlset["google_news_tags"],
            len(urlset["pages"]),
            lastlastmod or None,
        )
        logger.info("*** SAVING %s", ui)
        results.append(ui)

    crawler = Crawler(home_page, saver, MEDIA_CLOUD_USER_AGENT)
    while crawler.visit_one():
        time.sleep(sleep_time)

    return results


if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.INFO)

    for url in full_crawl_urlsets(sys.argv[1], 0.1):
        print(url)
