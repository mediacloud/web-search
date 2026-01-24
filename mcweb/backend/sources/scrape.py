# XXX todo: suppress requests(?) logging??

import logging
import traceback
import types                    # TracebackType
from dataclasses import dataclass, asdict
from typing import NamedTuple

# PyPI:
import feed_seeker
import requests
from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from mcmetadata.feeds import normalize_url
from mcmetadata.requests_arcana import insecure_requests_session
from mcmetadata.webpages import MEDIA_CLOUD_USER_AGENT


# not from PyPI: package installed via github URL
from mc_sitemap_tools.discover import NewsDiscoverer

# local directory mcweb/backend/sources
from .action_history import ActionHistoryContext, _delegated_history, log_action
from .models import Source, Collection, ActionHistory, Feed
from .task_utils import monitored_collections

# mcweb/backend/util
from ..util.tasks import TaskLogContext

# mcweb/util
from util.send_emails import send_rescrape_email

# mcweb/
from settings import (
    ADMIN_EMAIL,
    EMAIL_ORGANIZATION,
    EMAIL_NOREPLY,
    SCRAPE_ERROR_RECIPIENTS,
    SCRAPE_TIMEOUT_SECONDS
)

logger = logging.getLogger(__name__)

SCRAPE_FROM_EMAIL = EMAIL_NOREPLY

# time for individual HTTP connect/read
SCRAPE_HTTP_SECONDS = SCRAPE_TIMEOUT_SECONDS / 5

def rss_page_fetcher(url: str) -> str:
    """
    custom fetcher for RSS pages for feed_seeker
    (adapted from from feed_seeker default_fetch_function)

    XXX make a Scraper method so can use passed timeout??
    """
    logger.debug("rss_page_fetcher %s", url)
    session = insecure_requests_session(MEDIA_CLOUD_USER_AGENT)

    try:
        # provide connection and read timeouts in case alarm based timeout fails
        # (scrapes sometimes hang).
        response = session.get(url,
                               timeout=(SCRAPE_HTTP_SECONDS, SCRAPE_HTTP_SECONDS))
        if response.ok:
            return response.text
        else:
            return ''  # non-fatal error
    except (requests.ConnectTimeout, # connect timeout
            requests.ConnectionError, # 404's
            requests.ReadTimeout,     # read timeout
            requests.TooManyRedirects, # redirect loop
            requests.exceptions.InvalidSchema, # email addresses
            requests.exceptions.RetryError):
        # signal page failure, but not bad enough to abandon site:
        return ''

class ScrapeContext(TaskLogContext):
    """
    context for rescrape tasks that send email

    sends email (split out and support MIME so can be used for alert system?)
    XXX maybe refactor for use by other tasks (eg; alert system)???
    """
    def __init__(self, *, options: dict, task_args: dict,
                 subject: str, email: str, what: str, id: int):
        self.subject = subject
        self.email = email
        self.recipients = [email]
        self.what = what        # "source" or "collection"
        self.id = id
        self.errors = False

        # init TaskLogContext:
        super().__init__(options=options, task_args=task_args)

    def __enter__(self) -> "ScrapeContext":
        super().__enter__()

        self.body_chunks: list[str] = []
        return self

    def add_body_chunk(self, chunk: str) -> None:
        logger.debug("body_chunk: %s", chunk)
        if not chunk.endswith("\n"):
            chunk += "\n"
            # XXX complain?
        self.body_chunks.append(chunk)

    def body(self):
        # separate source chunks with blank lines (each already has trailing newline)
        return "\n".join(self.body_chunks)

    def add_error_recipients(self):
        """
        add ADMIN_EMAIL & users in SCRAPE_ERROR_RECIPIENTS to recipients
        """
        if self.errors:
            return
        self.errors = True
        if ADMIN_EMAIL and ADMIN_EMAIL not in self.recipients:
            self.recipients.append(ADMIN_EMAIL)
        for u in SCRAPE_ERROR_RECIPIENTS:
            if u not in self.recipients:
                self.recipients.append(u)

    def __exit__(self, type_: type[BaseException],
                 value: BaseException,
                 traceback_: types.TracebackType) -> bool:
        if type_ or self.errors:
            self.subject += " (WITH ERRORS)"

        # logs before and after:
        send_rescrape_email(f"[{EMAIL_ORGANIZATION}] {self.subject}",
                            self.body(), SCRAPE_FROM_EMAIL, self.recipients)

        super().__exit__(type_, value, traceback_) # TaskLogContext

        return True             # suppress exception!!!!

@dataclass
class FeedCounts:
    total: int = 0              # total scraped
    added: int = 0              # total new added
    old: int = 0                # total old
    confirmed: int = 0          # total old confirmed

    def summary(self) -> str:
        """
        generate summary line for a source.
        after many tries to give a summary in english
        """
        return f"{self.added}/{self.total} added, {self.confirmed}/{self.old} confirmed"

class ScrapeSourceResult(NamedTuple):
    full: str
    # maybe FeedCounts instead of these? (would need error string)
    summary: str
    added: int

class ScrapeSourcesResult(NamedTuple):
    chunks: list[str]
    summary: str

class Scraper:
    """
    encapsulate scraping state
    """

    # XXX take timeout (make rss_page_fetcher a method)
    #   so different contexts can use different timeouts
    #   (longer for scrape single source)?
    # XXX take verbosity (for command line debug)??
    def __init__(self, verbosity: int):
        self.errors = False
        self.verbosity = verbosity
        self._reset_source([])

    def _reset_source(self, all_old_urls: list[str]):
        # reset per source
        # (could belong in a SourceScraper class, but trying to avoid that!)
        self.source_lines = []

        self.feed_counts = FeedCounts()
        self.feed_counts.old = len(all_old_urls)
        self.old_urls = {normalize_url(url) for url in all_old_urls}

    def _add_source_line(self, line: str):
        logger.debug("_add_source_line: %s", line.rstrip()) # without newlines!
        # Each line appended to list must end with a newline!
        if not line.endswith("\n"):
            line += "\n"
        self.source_lines.append(line)

    def _make_source_chunk(self, indent: str):
        """
        make a chunk of text from lines generated from scraping a source
        """
        chunk = indent.join(self.source_lines)
        self.source_lines = []
        return chunk

    def _scrape_source(self, source_id: int, homepage: str, name: str):
        """
        helper for scrape_source; may be called more than once
        """
        # Look for RSS feeds
        try:
            new_feed_generator = feed_seeker.generate_feed_urls(
                homepage, max_time=SCRAPE_TIMEOUT_SECONDS, fetcher=rss_page_fetcher)
            # create list so DB operations in process_urls are not under the timeout gun.
            self.process_urls(source_id, "rss", list(new_feed_generator))
        except requests.RequestException as e: # maybe just catch Exception?
            self._add_source_line(f"fatal error for rss: {e!r}")
            logger.warning("generate_feed_urls(%s): %r", homepage, e)
        except TimeoutError:
            self._add_source_line("timeout for rss")
            logger.warning("generate_feed_urls(%s): timeout", homepage)

        # Do quick look for Google News Sitemaps (does NOT do full site crawl)
        gnews_urls = []
        GNEWS = "news sitemap" # say something once, why say it again?

        try:
            nd = NewsDiscoverer(MEDIA_CLOUD_USER_AGENT)
            gnews_urls = nd.find_gnews_fast(homepage, timeout=SCRAPE_HTTP_SECONDS)
            # XXX if nothing, consider crawling deeper?
        except requests.RequestException as e:
            self._add_source_line(f"fatal error for {GNEWS} discovery: {e!r}")
            logger.exception("find_gnews_fast")

        if gnews_urls:
            self.process_urls(source_id, GNEWS, gnews_urls)

    def process_urls(self, source_id: int, from_: str, urls: list[str]):
        """
        from_ is description of where the feed came from (rss or sitemap)
        """
        for url in urls:
            self.feed_counts.total += 1
            nurl = normalize_url(url)
            if nurl in self.old_urls:
                if self.verbosity >= 1:
                    self._add_source_line(f"found existing {from_} feed {url}")
                logger.info("scrape_source(%d) found existing %s feed %s",
                            source_id, from_, url)
                self.feed_counts.confirmed += 1
            else:
                try:
                    feed = Feed(source_id=source_id, admin_rss_enabled=True, url=url)
                    feed.save()
                    print("XXX create ActionHistory entry for source here??")
                    self._add_source_line(f"added new {from_} feed {url}")
                    logger.info("scrape_source(%d, %s) added new %s feed %s",
                                source_id, homepage, from_, url)

                    # try to prevent trying to adding twice
                    # (but may make counts come out funny!)
                    self.old_urls.add(nurl)
                    self.feed_counts.added += 1
                except IntegrityError:
                    # happens when feed exists, but under a different source!
                    # could do lookup by URL, and report what source (name & id) it's under....
                    self._add_source_line(f"{from_} feed {url} exists under some other source!!!")
                    logger.warning("_scrape_source(%d, %s) duplicate %s feed %s (exists under another source?)",
                                   source_id, homepage, from_, url)
                    # XXX increment duplicate counter?
        # end _process_feeds

    def scrape_source(self, source_id: int, homepage: str, name: str) -> ScrapeSourceResult:
        """
        helper routine, was Source static method,
        Trying harder to avoid weird counts due to dups
        """
        # NOTE! want URLs regardless of whether disabled
        all_old_urls = [feed.url for feed in Feed.objects.filter(source_id=source_id)]

        # data for this source (ideally(!) a SourceScraper class????)
        self._reset_source(all_old_urls)

        # per-source header line
        self._add_source_line(f"Scraped source {source_id} ({name}), {homepage}")

        if homepage:
            self._scrape_source(source_id, homepage, name)
        else:
            # XXX try with http://(www.)NAME
            # XXX always try if nothing returned w/ homepage (can be www.foo.com/en/)
            # XXX generate from name?
            error = "MISSING HOMEPAGE"
            self._add_source_line(error)
            return ScrapeSourceResult(
                full=self._make_source_chunk(""), # error not indented
                summary=error,
                added=0)

        ################
        # done with all attempts/methods

        # XXX if nothing found, try feedly????

        summary = feed_counts.summary()

        self._add_source_line(summary)
        logger.info("%s", summary)

        # update last time this source was rescraped
        Source.update_last_rescraped(source_id=source_id, summary=summary)

        return ScrapeSourceResult(
            full=self._make_source_chunk("  "), # indent not applied to header line
            summary=summary,
            added=feed_counts.added) # return FeedCounts??

    def scrape_sources(self, queryset) -> ScrapeSourcesResult:
        """
        scrape multiple sources for a collection or auto-rescrape
        """
        processed = feeds_added = exceptions = 0

        chunks = []
        # XXX filter on platform??
        # XXX do pagination???
        for source in queryset.filter(url_search_string__isnull=True).all():
            processed += 1

            if source.url_search_string: # should not happen!!
                logger.error("source %d with url_search_string %s", source.id, source.url_search_string)
                continue

            logger.info("== calling scrape_source %d (%s)", source.id, source.name)
            # insert no lines here!
            try:
                ssr = self.scrape_source(source.id, source.homepage, source.name)
                # XXX sum up feed_counters.asdict() into a counter across all sources?
                feeds_added += ssr.added
                chunks.append(ssr.full)
            except Exception as e:
                exceptions += 1
                self.errors = True

                logger.exception("scrape_source exception in scrape_source %d", source.id)
                chunks.append(f"ERROR:\n{traceback.format_exc()}") # format_exc has final newline

                # for debug (seeing where hung by ^C-ing under
                # dokku-scripts/outside/run-manage-pdb.sh)
                if isinstance(e, KeyboardInterrupt):
                    raise
            # insert no lines here!
            logger.info("== finished scrape_source %d (%s)", source.id, source.name)

        summary = f"{processed} sources processed: {feeds_added} feeds added, {exceptions} exceptions)"
        chunks.append(summary)
        return ScrapeSourcesResult(chunks=chunks, summary=summary)

# NOTE! If arguments added, need to adjust both
# tasks.schedule_scrape_source AND management/commands/scrape-source.py
def scrape_source(*, source_id: int, homepage: str, name: str, email: str,
                  options: dict, task_args: dict) -> None:
    """
    invoked only from task.scrape_collection (decorated)
    """
    subject = f"Source {source_id} ({name}) scrape complete"

    # ScrapeContext handles exceptions, sends mail!
    with ScrapeContext(options=options, task_args=task_args,
                       subject=subject, email=email,
                       what="source", id=source_id) as sc:

        logger.info("== starting scrape_source %d (%s) %s for %s",
                    source_id, name, homepage, email)

        scraper = Scraper(verbosity=1)

        ssr = scraper.scrape_source(source_id, homepage, name, email)

        sc.add_body_chunk(ssr.chunk)

        logger.info(f"== finished _scrape_source %d (%s) %s for %s",
                    source_id, name, homepage, email)


# NOTE! If arguments added (or new options/task_args needed), need to adjust both
# tasks.shedule_scrape_collection AND management/commands/scrape-collection.py
# NOTE!!! expects task_args/options usable by TaskLogContext (incl. options["user"])
def scrape_collection(*, options: dict, task_args: dict,
        collection_id: int, email: str) -> None:
    """
    invoked only from task.scrape_collection (decorated)
    """

    with ScrapeContext(
            options=options, task_args=task_args,
            subject=f"Collection {collection_id} scrape complete",
            email=email,
            what="collection", id=collection_id) as sc, \
        ActionHistoryContext(
            user=User.objects.get(username=options["user"]), # may raise exception!
            action_type="rescrape-collection",
            object_model=ActionHistory.ModelType.COLLECTION,
            object_id=collection_id,
            object_name=f"Collection {collection_id}",
            additional_changes={},
            notes=None) as ahc:

        logger.info("==== starting scrape_collection(%d) for %s",
                        collection_id, email)

        scraper = Scraper(verbosity=0)

        # will raise exception if not found, so inside ScrapeContext for logging/email
        collection = Collection.objects.get(id=collection_id)

        sources = collection.source_set # all sources in collection
        sssr = scraper.scrape_sources(sources)

        for chunk in sssr.chunks:
            sc.add_body_chunk(chunk)
        sc.add_body_chunk(sssr.summary)

        if scraper.errors:
            sc.add_error_recipients()

        # XXX is email needed (isn't initiaiting username/email in AH row)???
        ahc.notes = f"Rescrape completed: {sssr.summary}, initiated by {email}"

        logger.info("==== finished _scrape_collection(%d, %s) for %s (%s)",
                    collection.id, collection.name, email, sssr.summary)
    # end with ScrapeContext, ActionHistoryContext


def autoscrape(*, options: dict, task_args: dict) -> None:
    """
    invoked only from task.scrape_collection (decorated)
    """

    # XXX create ActionHistoryContext (for what object model????)
    with TaskLogContext(options=options, task_args=task_args):
        scraper = Scraper(verbosity=0)
        count = options["count"]
        # XXX Nothing scraped within ndays??

        collection_ids = monitored_collections()

        sources = Sources.objects.filter(collections__id__in=collection_ids)\
                                 .order_by("last_rescraped")\
                                 .asc(nulls_first=True)\
                                 .limit(count)
    
        scrape.scrape_sources(sources)
        # XXX logging??

    # end with TaskLogContext
