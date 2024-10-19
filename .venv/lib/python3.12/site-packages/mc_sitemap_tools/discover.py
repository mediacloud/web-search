"""
tools for discovering *news* sitemaps
(urlsets with google news tags)
from a home page URL

when invoked from command line, takes a home page URL
"""

import logging
from typing import cast

# PyPI
import requests
from mcmetadata.feeds import normalize_url
from mcmetadata.requests_arcana import insecure_requests_session
from mcmetadata.webpages import MEDIA_CLOUD_USER_AGENT

# local package:
from . import parser

logger = logging.getLogger(__name__)

_TO = 30  # default timeout

# from usp/tree.py _UNPUBLISHED_SITEMAP_PATHS
_UNPUBLISHED_SITEMAP_INDEX_PATHS = [
    "sitemap.xml",
    "sitemap.xml.gz",
    "sitemap_index.xml",
    "sitemap-index.xml",
    "sitemap_index.xml.gz",
    "sitemap-index.xml.gz",
    ".sitemap.xml",
    "sitemap",
    "admin/config/search/xmlsitemap",
    "sitemap/sitemap-index.xml",
    # not in usp, seen at (AJC, inquirer, elnuevdia, reuters).com
    # (among others)
    "arc/outboundfeeds/sitemap-index/?outputType=xml",
    "arc/outboundfeeds/news-sitemap-index/?outputType=xml",
]
"""Paths which are not exposed in robots.txt but might still contain a sitemap index page."""

_UNPUBLISHED_GNEWS_SITEMAP_PATHS = [
    "arc/outboundfeeds/news-sitemap/?outputType=xml",  # AJC, inquirer, reuters
    "arc/outboundfeeds/sitemap/latest/?outputType=xml",  # dallasnews
    "feeds/sitemap_news.xml",  # bloomberg
    "google-news-sitemap.xml",  # ew.com, people.com
    "googlenewssitemap.xml",  # axs.com, accesshollywood.com
    "news-sitemap.xml",  # gannett-cdn.com (many cities), parade
    "news-sitemap-content.xml",  # scrippsnews.com
    "news/sitemap_news.xml",  # buzzfeed, NPR
    "sitemap_news.xml",  # bloomberg, bizjournals, cnbc
    "sitemap/news.xml",  # cnn
    "sitemaps/news.xml",  # cnet
    "sitemaps/new/news.xml.gz",  # NYT
    "sitemaps/sitemap-google-news.xml",  # huffpost.com
    "tncms/sitemap/news.xml",  # berkshireeagle, omaha, postandcourier, rutlandherald
    # 'sitemaps/news',     # thetimes
    # 'feed/google-news-sitemap-feed/sitemap-google-news', # newyorker
]
"""Paths which might contain a google news sitemap page, even if not in robots.txt"""


class PageType:
    """
    bitmasks for different page types
    """

    INDEX = 0x1
    URLSET = 0x2  # urlset w/o google <news:news>
    GNEWS = 0x4  # urlset w/ google <news:news>
    ALL = 0xFFF


class NewsDiscoverer:
    """
    class to scan a site for top-level (robots.txt)
    sitemap urlsets with google news tags
    """

    def __init__(self, user_agent: str):
        self.user_agent = user_agent

    def page_get(self, url: str, timeout: int = _TO) -> requests.Response:
        """
        One place to fetch them all.
        timeout value used for both connect and read timeouts.
        NOTE! requests Response object is "falsey" if page not retrieved!
        """
        logger.debug("page_get: %s", url)
        sess = insecure_requests_session(self.user_agent)
        resp = sess.get(url, allow_redirects=True, timeout=(timeout, timeout))
        return resp

    def sitemap_get(self, url: str, timeout: int = _TO) -> parser.BaseSitemap | None:
        try:
            resp = self.page_get(url, timeout=timeout)
            # defined as UTF-8; using resp.text runs character
            # detection if no character set in HTTP Response, which is
            # slow, at least on large files eg;
            # https://googlecrawl.npr.org/video/sitemap_video.xml
            # which is 33,221,811 bytes (still have to parse it all).
            text = resp.content.decode("utf-8")
            logger.info("%s: got %d chars", url, len(text))
            p = parser.XMLSitemapParser(url, text)
            return p.sitemap()
        except Exception as e:
            logger.info("%s %r", url, e)
            return None

    def check_sitemap_type(self, url: str, sm: parser.BaseSitemap, accept: int) -> bool:
        """
        take parsed sitemap page and bitmask of acceptable page types
        """
        smtype = sm.get("type")
        logger.info("%s (%s) %#x", url, smtype, accept)

        if smtype == "index":
            return (accept & PageType.INDEX) != 0

        if smtype != "urlset":
            return False
        us = cast(parser.Urlset, sm)
        if us.get("google_news_tags"):
            logger.info("%s has google news tags", url)
            return (accept & PageType.GNEWS) != 0
        return (accept & PageType.URLSET) != 0

    def sitemap_get_and_check_type(
        self, url: str, accept: int = PageType.ALL, timeout: int = _TO
    ) -> parser.BaseSitemap | None:
        """
        fetch `url`, parse, and return parsed result
        if page type in `accept` bitmask
        """
        sm = self.sitemap_get(url, timeout=timeout)
        if not sm:
            return None
        if self.check_sitemap_type(url, sm, accept):
            return sm
        return None

    def robots_sitemaps(
        self, url: str, homepage: bool = True, timeout: int = _TO
    ) -> list[str]:
        """
        fetch robots.txt and return URLs of sitemap pages
        (may include RSS URLs!)

        if homepage is True, use as base for robots.txt,
        else use as full URL without modification
        """
        robots_txt_url = url
        if homepage:
            if not robots_txt_url.endswith("/"):
                robots_txt_url += "/"
            robots_txt_url += "robots.txt"

        try:
            resp = self.page_get(robots_txt_url, timeout=timeout)
        except requests.RequestException as exc:
            logger.info("robots_sitemaps url %s: %r", url, exc)
            return []

        if not resp or not resp.text:
            return []

        # https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt#file-format
        # says:
        #
        # The robots.txt file must be a UTF-8 encoded plain text file and
        # the lines must be separated by CR, CR/LF, or LF.
        #
        # Google ignores invalid lines in robots.txt files, including the
        # Unicode Byte Order Mark (BOM) at the beginning of the robots.txt
        # file, and use only valid lines. For example, if the content
        # downloaded is HTML instead of robots.txt rules, Google will try
        # to parse the content and extract rules, and ignore everything
        # else.
        #
        # Similarly, if the character encoding of the robots.txt file
        # isn't UTF-8, Google may ignore characters that are not part of
        # the UTF-8 range, potentially rendering robots.txt rules invalid.
        #
        # Google currently enforces a robots.txt file size limit of 500
        # kibibytes (KiB). Content which is after the maximum file size is
        # ignored. You can reduce the size of the robots.txt file by
        # consolidating rules that would result in an oversized robots.txt
        # file. For example, place excluded material in a separate
        # directory.
        text = resp.text

        urls = []
        for line in text.splitlines():  # handle \n \r \r\n
            if ":" not in line:
                continue

            tok, rest = line.split(":", 1)
            if tok.lower() == "sitemap":
                url = rest.strip()
                urls.append(url)
        return urls

    def robots_gnews_sitemaps(
        self, url: str, homepage: bool = True, timeout: int = _TO
    ) -> list[str]:
        """
        Fetch robots.txt using `url`.
        If `homepage` is True, use as base for robots.txt,
        else use as full URL without modification.

        Returns list of URLs for urlset pages with google news tags.
        """
        urls = []
        for url in self.robots_sitemaps(url, homepage, timeout=timeout):
            try:
                sm = self.sitemap_get_and_check_type(
                    url, PageType.GNEWS, timeout=timeout
                )
                if sm:
                    urls.append(url)
            except requests.RequestException as exc:
                logger.info("robots_gnews_sitemaps url %s: %r", url, exc)
        return urls

    def unpublished_gnews_sitemaps(
        self, homepage_url: str, timeout: int = _TO
    ) -> list[str]:
        """
        check locations where google news urlsets have been seen
        """
        if not homepage_url.endswith("/"):
            homepage_url += "/"

        urls = []
        for p in _UNPUBLISHED_GNEWS_SITEMAP_PATHS:
            url = homepage_url + p
            try:
                sm = self.sitemap_get_and_check_type(
                    url, PageType.GNEWS, timeout=timeout
                )
                if sm:
                    urls.append(url)
            except requests.RequestException as exc:
                logger.info("unpublished_gnews_sitemaps url %s: %r", url, exc)
        return urls

    def _unpub_path(self, url: str) -> bool:
        """
        helper: return True if url has a "well known" path

        npr.org robots.txt has feeds with WKPs in domain googlecrawl.npr.org
        """
        for p in _UNPUBLISHED_GNEWS_SITEMAP_PATHS:
            if url.endswith(p):
                return True
        return False

    def find_gnews_fast(
        self, homepage_url: str, max_robots_pages: int = 2, timeout: int = _TO
    ) -> list[str]:
        """
        quickly scan a source for urlsets with google news tags
        (without following sitemap index page links)
        """

        # originally returned just robots_urls if reasonable length, but
        # reuters.com has a feed in robots.txt, but the BEST sitemap is
        # found using well-known paths.
        robots_urls = self.robots_gnews_sitemaps(homepage_url, timeout=timeout)
        nurls = len(robots_urls)

        if nurls > max_robots_pages:
            logger.info("%s: %d urls from robots.txt", homepage_url, nurls)
            # here if too many urls in robots.txt
            # see if a subset have "well known" paths
            robots_urls = [url for url in robots_urls if self._unpub_path(url)]
            logger.info(
                "%s: %d urls from robots.txt after pruning",
                homepage_url,
                len(robots_urls),
            )
            # cbsnews.com has 47 before pruning, 17 after (local news pages)
            # not doing anything further until some aggregious case found
            # (urlsets of historical news listed in robots.txt)

        unpub_urls = self.unpublished_gnews_sitemaps(homepage_url, timeout=timeout)

        # return list of union of both robots_urls & unpub_urls (avoiding dups)
        return self._unique_feeds(robots_urls + unpub_urls)

    def _unique_feeds(self, urls: list[str]) -> list[str]:
        """
        prefers https://www.foo.bar over http://foo.bar, https://foo.bar,
        http://www.foo.bar except for domains starting in x, y, or z.

        changes to the output may result in duplicate feeds
        """
        # create mapping of normalized urls to original urls, using sorted URLs
        # (so output won't differ based on order of input URLs)
        return list({normalize_url(url): url for url in sorted(urls)}.values())


if __name__ == "__main__":
    import sys

    logging.basicConfig(level=logging.DEBUG)

    def usage() -> None:
        sys.stderr.write(f"Usage: {sys.argv[0]} DOMAIN\n")
        sys.exit(1)

    nd = NewsDiscoverer(MEDIA_CLOUD_USER_AGENT)

    # add static tests?
    def test(urls: list[str], expect: list[str]) -> None:
        assert nd._unique_feeds(urls) == expect

    test(["https://foo.bar", "http://foo.bar"], ["https://foo.bar"])
    test(["http://foo.bar", "https://foo.bar"], ["https://foo.bar"])
    test(["http://www.foo.bar", "http://foo.bar"], ["http://www.foo.bar"])
    test(["http://foo.bar", "http://www.foo.bar"], ["http://www.foo.bar"])

    if len(sys.argv) != 2:
        usage()
    domain = sys.argv[1]
    if (
        "." not in domain
        or domain.startswith("www.")
        or domain.startswith("http:")
        or domain.startswith("https:")
    ):
        usage()

    homepage = "https://www." + domain

    timeout = 30

    # handle options for which method(s) to try!!! types to accept!!!
    if False:
        print("-- robots.txt")
        for url in nd.robots_gnews_sitemaps(homepage, timeout=timeout):
            print(url)

        print("-- unpublished")
        for url in nd.unpublished_gnews_sitemaps(homepage, timeout=timeout):
            print(url)

    print("-- find_gnews_fast")
    for url in nd.find_gnews_fast(homepage, timeout=timeout):
        print(url)
