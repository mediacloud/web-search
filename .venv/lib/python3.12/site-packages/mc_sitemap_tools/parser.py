"""
Sitemap parsers, extracted from ultimate-sitemap-parser fetch_parse.py

* just parsing; no fetching
* performs minimal field parsing/validation
* returns JSONable data
"""

import html
import logging
import re
import time
from typing import TypedDict
from urllib.parse import urlparse, urlunparse
from xml.parsers.expat import ExpatError, ParserCreate

logger = logging.getLogger(__name__)

# from usp.exceptions:


class SitemapException(Exception):
    """
    Problem due to which we can't run further, e.g. wrong input parameters.
    """

    pass


class InvalidSitemapException(SitemapException):
    """
    Cannot be parsed as sitemap: not from usp
    """

    pass


class SitemapXMLParsingException(Exception):
    """
    XML parsing exception to be handled gracefully.
    """

    pass


class SitemapXMLParsingUnexpectedTag(SitemapXMLParsingException):
    """
    value will be tag name
    """


# from usp.helpers


__URL_REGEX = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)
"""Regular expression to match HTTP(s) URLs."""


def is_http_url(url: str) -> bool:
    """
    Returns true if URL is of the "http" ("https") scheme.

    :param url: URL to test.
    :return: True if argument URL is of the "http" ("https") scheme.
    """
    if len(url) == 0:
        logger.debug("URL is empty")
        return False

    # commented out: too much noise under mcweb
    # logger.debug("Testing if URL '%s' is HTTP(s) URL", url)

    if not re.search(__URL_REGEX, url):
        logger.debug("URL '%s' does not match URL's regexp", url)
        return False

    try:
        # Try parsing the URL
        uri = urlparse(url)
        _ = urlunparse(uri)
    except Exception as ex:
        logger.debug("Cannot parse URL %s: %r", url, ex)
        return False

    if not uri.scheme:
        logger.debug("Scheme is undefined for URL %s", url)
        return False
    if not uri.scheme.lower() in ["http", "https"]:
        logger.debug("Scheme is not HTTP(s) for URL %s", url)
        return False
    if not uri.hostname:
        logger.debug("Host is undefined for URL %s", url)
        return False

    return True


def html_unescape_strip(string: str) -> str:
    """
    Decode HTML entities, strip string, set to None if it's empty; ignore None as input.

    :param string: String to decode HTML entities in.
    :return: Stripped string with HTML entities decoded; None if parameter string was empty or None.
    """
    if string:
        string = html.unescape(string)
        string = string.strip()
        if not string:
            string = ""
    return string


################

# dicts, so JSONifiable
# NOTE! At runtime, TypedDicts are just Dict objects!


class SitemapEntry(TypedDict, total=False):
    """
    entry from a "urlset" page.
    values only present in dict if tag appeared.
    """

    loc: str  # url: must have!
    lastmod: str
    changefreq: str
    priority: str

    # metadata from google <news:news>
    news_title: str
    news_pub_date: str  # publication date
    news_pub_name: str  # publication name
    news_pub_lang: str  # publication language
    news_access: str
    news_keywords: str
    news_tickers: str


# Just a dict at runtime, so must refer to "type" field


class BaseSitemap(TypedDict):
    url: str
    type: str  # urlset or index
    last_fetch_ts: float
    size: int  # size in characters


class Urlset(BaseSitemap):
    """
    sitemap "urlset" page
    """

    google_news_tags: bool
    pages: list[SitemapEntry]


class Index(BaseSitemap):
    """
    sitemap "index" page
    """

    sub_sitemap_urls: list[str]


################


class XMLSitemapParser:
    """
    Top level XML sitemap parser;
    Determines if urlset or sitemapindex
    """

    __XML_NAMESPACE_SEPARATOR = " "

    def __init__(self, url: str, content: str):
        self._url = url
        self._content = content

        # Will be instantiated when first tag parsed:
        self._concrete_parser: _AbstractXMLSitemapParser | None = None

    def sitemap(self) -> BaseSitemap:
        parser = ParserCreate(namespace_separator=self.__XML_NAMESPACE_SEPARATOR)
        parser.StartElementHandler = self._xml_element_start
        parser.EndElementHandler = self._xml_element_end
        parser.CharacterDataHandler = self._xml_char_data

        isfinal = True  # for clarity: keyword arg not allowed
        try:
            parser.Parse(self._content, isfinal)
        except ExpatError:  # try translating ExpatError
            top = self._content[:1024].lower()
            if top.find("<!doctype") or top.find("<html"):
                raise SitemapXMLParsingUnexpectedTag("html?")
            raise

        if not self._concrete_parser:
            raise InvalidSitemapException(self._url)

        return self._concrete_parser._sitemap(len(self._content))

    @classmethod
    def __normalize_xml_element_name(cls, name: str) -> str:
        """
        Replace the namespace URL in the argument element name with internal namespace.

        * Elements from http://www.sitemaps.org/schemas/sitemap/0.9 namespace will be prefixed with "sitemap:",
          e.g. "<loc>" will become "<sitemap:loc>"

        * Elements from http://www.google.com/schemas/sitemap-news/0.9 namespace will be prefixed with "news:",
          e.g. "<publication>" will become "<news:publication>"

        For non-sitemap namespaces, return the element name with the namespace stripped.

        :param name: Namespace URL plus XML element name, e.g. "http://www.sitemaps.org/schemas/sitemap/0.9 loc"
        :return: Internal namespace name plus element name, e.g. "sitemap loc"
        """

        name_parts = name.split(cls.__XML_NAMESPACE_SEPARATOR)
        if len(name_parts) == 1:
            namespace_url = ""
            name = name_parts[0]
        elif len(name_parts) == 2:
            namespace_url = name_parts[0]
            name = name_parts[1]
        else:
            raise SitemapXMLParsingException(
                f"Unable to determine namespace for element '{name}'"
            )

        if "/sitemap/" in namespace_url:
            name = f"sitemap:{name}"
        elif "/sitemap-news/" in namespace_url:
            name = f"news:{name}"
        else:
            # We don't care about the rest of the namespaces, so just keep the
            # plain element name
            pass

        return name

    def _xml_element_start(self, name: str, attrs: dict[str, str]) -> None:
        """
        installed as parser.StartElementHandler
        """
        name = self.__normalize_xml_element_name(name)
        if self._concrete_parser:
            self._concrete_parser.xml_element_start(name=name, attrs=attrs)
        else:
            # Root element -- initialize concrete parser
            if name == "sitemap:urlset":
                self._concrete_parser = UrlsetXMLSitemapParser(url=self._url)
            elif name == "sitemap:sitemapindex":
                self._concrete_parser = _IndexXMLSitemapParser(url=self._url)
            else:
                # value documented to be tag name above:
                raise SitemapXMLParsingUnexpectedTag(name)

    def _xml_element_end(self, name: str) -> None:
        """
        installed as parser.EndElementHandler
        """
        name = self.__normalize_xml_element_name(name)
        # usp threw an error if self._concrete_parser, which throws
        # an error on an empty page with a single <sitemapindex/> or <urlset/>
        # element.
        if self._concrete_parser:
            self._concrete_parser.xml_element_end(name=name)

    def _xml_char_data(self, data: str) -> None:
        """
        installed as parser.CharacterDataHandler
        """
        if not self._concrete_parser:
            raise SitemapXMLParsingException(
                "Concrete sitemap parser should be set by now."
            )
        self._concrete_parser.xml_char_data(data=data)


class _AbstractXMLSitemapParser:
    """
    Abstract XML sitemap parser;
    base for _IndexXMLSitemapParser and UrlsetXMLSitemapParser
    """

    def __init__(self, url: str):
        self._url = url
        self._last_char_data = ""
        self._last_char_data_set = False

    def xml_element_start(self, name: str, attrs: dict[str, str]) -> None:
        # get ready to collect char data
        self._reset_char_data()

    def xml_element_end(self, name: str) -> None:
        # End of any element: always resets last encountered character data
        # (only interested in data inside the innermost tag)
        self._reset_char_data()

    def _reset_char_data(self) -> None:
        self._last_char_data = ""
        self._last_char_data_set = False

    def xml_char_data(self, data: str) -> None:
        # Handler might be called multiple times for what essentially is a single string, e.g. in case of entities
        # ("ABC &amp; DEF"), so this is why we're appending
        self._last_char_data += data
        self._last_char_data_set = True

    def _sitemap(self, size: int) -> BaseSitemap:
        raise NotImplementedError("Abstract method.")


class _IndexXMLSitemapParser(_AbstractXMLSitemapParser):
    """
    Concrete XML parser for <sitemap:sitemapindex>
    referenced via XMLSitemapParser._concrete_parser
    """

    def __init__(self, url: str):
        super().__init__(url=url)

        self._sub_sitemap_urls: list[str] = []

    def xml_element_end(self, name: str) -> None:
        if name == "sitemap:loc":
            sub_sitemap_url = html_unescape_strip(self._last_char_data)
            if not is_http_url(sub_sitemap_url):
                logger.warning(
                    "Sub-sitemap URL does not look like one: %s", sub_sitemap_url
                )
            else:
                if sub_sitemap_url and sub_sitemap_url not in self._sub_sitemap_urls:
                    self._sub_sitemap_urls.append(sub_sitemap_url)

        super().xml_element_end(name=name)

    def _sitemap(self, size: int) -> BaseSitemap:
        return Index(
            url=self._url,
            type="index",
            sub_sitemap_urls=self._sub_sitemap_urls,
            last_fetch_ts=time.time(),
            size=size,
        )


class UrlsetXMLSitemapParser(_AbstractXMLSitemapParser):
    """
    Concrete XML parser for <sitemap:urlset> pages;
    referenced via XMLSitemapParser._concrete_parser
    """

    def __init__(self, url: str):
        super().__init__(url=url)

        self._current_page: SitemapEntry | None = None
        self._pages: list[SitemapEntry] = []
        self._google_news_tags: bool = False

    def xml_element_start(self, name: str, attrs: dict[str, str]) -> None:
        super().xml_element_start(name=name, attrs=attrs)
        if name == "sitemap:url":
            if self._current_page is not None:
                raise SitemapXMLParsingException("nested <url>?")
            self._current_page = SitemapEntry()

    def _save(self, name: str, required: str = "") -> None:
        """
        save cleaned up _last_char_data under name, IF set.
        Will only create dict entry if the tag appeared.
        Will have entry with empty value if tag had empty contents.
        """
        if not self._last_char_data:
            if required:
                logger.warning(f"No data inside <{required}>")
            return

        if self._current_page is None:
            raise SitemapXMLParsingException(
                f"{name}: {self._last_char_data} not inside <url>"
            )

        # enforce TypeDict fields
        # All SitemapEntry fields declared as optional, so key not
        # present if tag not seen AND <loc> isn't required to be first.
        assert name in SitemapEntry.__optional_keys__
        self._current_page[name] = html_unescape_strip(  # type: ignore[literal-required]
            self._last_char_data
        )

    def _gn_save(self, name: str, required: str = "") -> None:
        """
        save a google news <news:news> sub-tag value
        """
        self._google_news_tags = True
        self._save(name, required)

    def xml_element_end(self, name: str) -> None:
        if name == "sitemap:url":
            # XXX don't append if "loc" not set?
            if self._current_page and self._current_page not in self._pages:
                self._pages.append(self._current_page)
            self._current_page = None
        elif name == "sitemap:urlset":
            # complain if not well formed (extra </url>)
            assert self._current_page is None
        else:
            assert self._current_page is not None
            if name == "sitemap:loc":
                # Every entry must have <loc> value
                self._save("loc", required=name)
            elif name == "sitemap:lastmod":
                self._save("lastmod")
            elif name == "sitemap:changefreq":
                self._save("changefreq")
            elif name == "sitemap:priority":
                self._save("priority")
            elif name == "news:name":  # news/publication/name
                self._gn_save("news_pub_name")
            elif name == "news:language":  # news/publication/language
                self._gn_save("news_pub_lang")
            elif name == "news:publication_date":
                self._gn_save("news_pub_date")
            elif name == "news:title":
                # Every Google News sitemap entry must have <title>
                # (this only requires <title>, if present, to have non-empty contents)
                self._save("news_title", required=name)
            elif name == "news:access":
                self._save("news_access")
            elif name == "news:keywords":
                self._gn_save("news_keywords")
            elif name == "news:stock_tickers":
                self._gn_save("news_tickers")

        super().xml_element_end(name=name)

    def _sitemap(self, size: int) -> BaseSitemap:
        pages = [page for page in self._pages if page.get("loc")]
        return Urlset(
            url=self._url,
            type="urlset",
            google_news_tags=self._google_news_tags,
            pages=pages,
            last_fetch_ts=time.time(),
            size=size,
        )


if __name__ == "__main__":
    import json
    import sys

    for fname in sys.argv[1:]:
        print("================", fname)
        with open(fname) as f:
            p = XMLSitemapParser("fname", f.read())
        try:
            s = p.sitemap()
            json.dump(s, sys.stdout)
        except SitemapException as e:
            print(e)
