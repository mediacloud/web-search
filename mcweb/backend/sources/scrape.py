"""
Feed scraping code

Beware all ye who enter here:

This code has evolved through REPEATED evolutionary reworks,
so it's less than perfectly lovely.

The code runs in the context of a background task, so every attempt is
made to be safe/reliable, and capture logs of what happens, and in the
case of (admin) user initiated tasks, send email that is concise and
understandable!

Debug in the context of the manage.py process is possible
with the scrape-source, scrape-collection and autoscrape
command by default (--queue is necessary to queue a task)
"""

import datetime as dt
import logging
import traceback
import types                    # TracebackType
from collections.abc import Iterable
from dataclasses import dataclass, asdict
from typing import NamedTuple

# PyPI:
import feed_seeker
import requests
from django.contrib.auth.models import User
from django.db.models import F, Q
from django.db.utils import IntegrityError
from mcmetadata.feeds import normalize_url
from mcmetadata.requests_arcana import insecure_requests_session
from mcmetadata.webpages import MEDIA_CLOUD_USER_AGENT


# not from PyPI: package installed via github URL
from mc_sitemap_tools.discover import NewsDiscoverer

# local directory mcweb/backend/sources
from .action_history import ActionHistoryContext, log_action
from .models import ActionHistory, Collection, Feed, Source
from .task_utils import monitored_collections, yesterday

# mcweb/backend/util
from ..util.tasks import TaskLogContext, TaskCommand

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

class ScrapeTaskCommand(TaskCommand):
    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true",
                            help="Disable scraping, updating.")
        super().add_arguments(parser)

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


class ScrapeTaskLogContext(TaskLogContext):
    """
    suppress verbose DEBUG logging from some libraries
    """
    SUPPRESS = ["urllib3", "chardet"] # logger names to turn down to INFO

    def __init__(self, *, task_args: dict, options: dict):
        super().__init__(task_args=task_args, options=options)
        self._loggers: list[tuple[logging.Logger, int]] = []

    def __enter__(self) -> "ScrapeTaskLogContext":
        for name in self.SUPPRESS:
            ll = logging.getLogger(name)
            self._loggers.append( (ll, ll.getEffectiveLevel()) )
            ll.setLevel(logging.INFO)
        super().__enter__()
        return self

    def __exit__(self, type_: type[BaseException],
                 value: BaseException,
                 traceback_: types.TracebackType) -> bool:
        for ll, level in self._loggers:
            ll.setLevel(level)
        self._loggers = []      # in case reused!
        return super().__exit__(type_, value, traceback_)


class ScrapeMailContext(ScrapeTaskLogContext):
    """
    context for rescrape tasks that send email summaries to initiator

    XXX maybe refactor for use by other tasks (eg; alert system)???
    (would need to send MIME)
    """
    def __init__(self, *, options: dict, task_args: dict, subject: str, email: str):
        self.subject = subject
        self.recipients = [email]
        self.errors = False

        # init ScrapeTaskLogContext:
        super().__init__(options=options, task_args=task_args)

    def __enter__(self) -> "ScrapeMailContext":
        super().__enter__()

        # list of chunks (paragraphs) separated by blank lines in email
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

        super().__exit__(type_, value, traceback_) # ScrapeTaskLogContext

        return True             # suppress exception!!!!

@dataclass
class FeedCounts:
    """
    Count across feeds in a Source.

    could be discrete Scraper members, but this keeps it all
    in one place (easy to pass, format and reset).
    """
    # in theory added + confirmed == total, old >= confirmed
    total: int = 0              # total scraped
    added: int = 0              # total new added
    old: int = 0                # total old
    confirmed: int = 0          # total old confirmed

    def summary(self) -> str:
        """
        generate summary line for a source.
        format arrived at after many tries to give a summary in english
        """
        return f"{self.added}/{self.total} added, {self.confirmed}/{self.old} confirmed"

# these NamedTuples _COULD_ be scraper members declared to be valid
# after certain method calls, but this makes it more explicit what
# data is valid and when (this one goes to eleven)

class ScrapeSourceResult(NamedTuple):
    """
    result of Scraper.scrape_source
    """
    full: str
    counts: FeedCounts

class ScrapeSourcesResult(NamedTuple):
    """
    result of Scraper.scrape_sources
    """
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
    def __init__(self, options: dict, verbosity: int, via: str):
        """
        options: dict of kwargs from ScrapeTaskCommand
                (or forged by schedule_scrape_XXX in tasks.py)
                must include "user"
        verbosity: non-zero to show individual feeds added in per-source "chunk" (for email)
        via: string indicating task type (and object id) for ActionHistory
        """
        self.options = options
        self.errors = False
        self.verbosity = verbosity # zero for batches/collections
        self.via = via
        self.user = User.objects.get(username=options["user"]) # may raise exception!
        self._reset_source([])

    def _reset_source(self, all_old_urls: list[str]):
        # reset per source
        # (could belong in a SourceScraper class, but trying to avoid that!)
        self.source_lines = []

        self._feed_counts = FeedCounts()
        self._feed_counts.old = len(all_old_urls)
        self.old_urls = {normalize_url(url) for url in all_old_urls}

    def _add_source_line(self, line: str):
        """
        Each line appended to list must end with a newline,
        logging each as added to show progress (in long collection/auto scrapes)
        but DON'T want newline in logged message!
        """
        if line and line[-1] == "\n":
            log_line = line[:-1]
        else:
            log_line = line
            line += "\n"
        logger.info(">>%s", log_line)
        self.source_lines.append(line)

    def _make_source_chunk(self, indent: str):
        """
        make a chunk of text (paragraph) from lines generated from scraping a source
        """
        chunk = indent.join(self.source_lines)
        self.source_lines = []
        return chunk

    def _scrape_source(self, source_id: int, homepage: str, name: str):
        """
        helper for scrape_source; may be called more than once per source
        """
        # Look for RSS feeds
        try:
            new_feed_generator = feed_seeker.generate_feed_urls(
                homepage, max_time=SCRAPE_TIMEOUT_SECONDS, fetcher=rss_page_fetcher)
            # create list so DB operations in process_urls are not under the timeout gun.
            self._process_urls(source_id, homepage, "rss", new_feed_generator)
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
            self._process_urls(source_id, homepage, GNEWS, gnews_urls)

    def _process_urls(self, source_id: int, homepage: str, from_: str, urls: Iterable[str]):
        """
        here to process newly found URLs.
        from_ is description of where the feed came from (rss or sitemap)
        """
        # attempt to eliminate duplicates thru normalization
        nurls = {normalize_url(url): url for url in urls}

        for nurl, url in nurls.items():
            self._feed_counts.total += 1
            if nurl in self.old_urls:
                if self.verbosity > 0:
                    self._add_source_line(f"found existing {from_} feed {url}")
                logger.info("scrape_source(%d) found existing %s feed %s",
                            source_id, from_, url)
                # XXX could create ActionHistory!
                self._feed_counts.confirmed += 1
            else:
                try:
                    feed = Feed(source_id=source_id, admin_rss_enabled=True, url=url)
                    feed.save()

                    logger.info("scrape_source(%d, %s) added new %s feed %s",
                                source_id, homepage, from_, url)

                    # create ActionHistory row: will be child of SOURCE entry
                    # NOTE: "notes" omits user (part of row)??
                    log_action(self.user, "create", ActionHistory.ModelType.FEED, feed.id,
                               object_name=url, notes=f"{from_} feed via {self.via} for {self.user.username}")

                    # try to prevent trying to adding twice
                    # BUT new dup feeds come out as "verified"!!
                    self.old_urls.add(nurl)
                    self._feed_counts.added += 1
                except IntegrityError:
                    # happens when feed exists, but under a different source!
                    # could do lookup by URL, and report what source (name & id) it's under....
                    self._add_source_line(f"{from_} feed {url} exists under some other source!!!")
                    logger.warning("process_urls(%d, %s) duplicate %s feed %s (exists under another source?)",
                                   source_id, homepage, from_, url)
                    # XXX increment duplicate counter?
        # end _process_feeds

    def _scrape_source_worker(self, source_id: int, homepage: str, name: str) -> None:
        """
        do actual scrape_source work!
        called once per source, here to avoid double indent,
        and make scrape_source call as clear as possible
        """
        logger.debug("_scrape_source_worker %d %s %s", source_id, homepage, name)

        if homepage:
            # XXX try validating home page? starts with http(s)://valid.do.ma.in??
            self._scrape_source(source_id, homepage, name)

        # if no feeds found, try harder:
        # maybe always if single source scrape??
        if (self._feed_counts.total == 0 and
            homepage != f"http://{name}" and
            homepage != f"https://{name}"):
            self._scrape_source(source_id, f"http://{name}", name)

        # XXX if still zero try www.{name}?? (make above into local function that formats/checks urls)

        # XXX if nothing found, try feedly????

    def scrape_source(self, source_id: int, homepage: str, name: str, extra: str = "") -> ScrapeSourceResult:
        """
        called for single source, and by scrape_sources
        """
        # NOTE! want feed URLs regardless of whether disabled
        all_old_urls = [feed.url for feed in Feed.objects.filter(source_id=source_id)]
        self._reset_source(all_old_urls)

        # per-source header line
        self._add_source_line(f"Scraped source {source_id} ({name}){extra}")

        dry_run = self.options.get("dry_run", False)
        if dry_run:
            summary = "skipped"
        else:
            # will be parent event for Feed create events:
            with ActionHistoryContext(
                    user=self.user,
                    action_type=self.via.lower().replace(" ", "_"), # or "scrape"?
                    object_model=ActionHistory.ModelType.SOURCE,
                    object_id=source_id,
                    object_name=name,
                    notes=f"started via {self.via} for {self.user.username}"
            ) as ahc:
                self._scrape_source_worker(source_id, homepage, name)
                summary = self._feed_counts.summary()
                Source.update_last_rescraped(source_id=source_id, summary=summary)
                ahc.notes = f"{summary} via {self.via} for {self.user.username}"

        self._add_source_line(summary)

        return ScrapeSourceResult(
            full=self._make_source_chunk("  "), # indent not applied to header line
            counts=self._feed_counts)

    def scrape_sources(self, queryset, limit: int | None = None) -> ScrapeSourcesResult:
        """
        public method to scrape multiple sources for a collection or autoscrape!!
        """

        # limit to online-news parent sources (children can't have feeds)
        q = queryset.filter(url_search_string__isnull=True,
                            platform="online_news")\
                    .distinct()
        logger.info("=== scrape_sources start: %d candidates, limit %r",  q.count(), limit)

        if limit is not None:   # apply limit, if any
            q = q[:limit]

        processed = feeds_added = exceptions = 0
        chunks = []

        # pagination not practical: scraping will remove Sources from result set!
        for source in q.all():
            # have I mentioned I hate the Python ternary? leading space for "extra" arg.
            if source.last_rescraped:
                last_rescrape_extra = " last rescraped " + source.last_rescraped.strftime("%F %T")
            else:
                last_rescrape_extra = " never rescraped"

            logger.info("Source %d (%s)%s", source.id, source.name, last_rescrape_extra)
            processed += 1

            if source.url_search_string: # should not happen!!
                logger.warning("source %d with url_search_string %s", source.id, source.url_search_string)
                continue

            logger.info("== calling scrape_source %d (%s)", source.id, source.name)
            # insert no lines here!
            try:
                ssr = self.scrape_source(source.id, source.homepage, source.name, last_rescrape_extra)
                # XXX sum up feed_counters.asdict() into a Counter??
                feeds_added += ssr.counts.added
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

        summary = f"{processed} sources processed: {feeds_added} feeds added, {exceptions} errors"
        logger.info("=== scrape sources end: %s", summary)
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

    # ScrapeMailContext handles exceptions, sends mail!
    with ScrapeMailContext(options=options, task_args=task_args,
                       subject=subject, email=email) as sc:

        # scraping single source, so include added feed urls in email text
        scraper = Scraper(options, verbosity=1, via=f"scrape source {source_id}")
        ssr = scraper.scrape_source(source_id, homepage, name)
        sc.add_body_chunk(ssr.full) # no need for summary or count


# NOTE! If arguments added (or new options/task_args needed), need to adjust both
# tasks.shedule_scrape_collection AND management/commands/scrape-collection.py
# NOTE!!! expects task_args/options usable by TaskLogContext (incl. options["user"])
def scrape_collection(*, options: dict, task_args: dict,
        collection_id: int, email: str) -> None:
    """
    invoked only from task.scrape_collection (decorated)
    """

    with ScrapeMailContext(
            options=options, task_args=task_args,
            subject=f"Collection {collection_id} scrape complete",
            email=email) as smc:
        scraper = Scraper(options, verbosity=0, via=f"scrape collection {collection_id}")

        # will raise exception if not found, so inside ScrapeMailContext for logging/email
        collection = Collection.objects.get(id=collection_id)

        sources = collection.source_set # all sources in collection
        sssr = scraper.scrape_sources(sources)

        for chunk in sssr.chunks: # includes summary
            smc.add_body_chunk(chunk)

        if scraper.errors:
            smc.add_error_recipients()

    # end with ScrapeMailContext


def autoscrape(*, options: dict, task_args: dict) -> None:
    """
    invoked ONLY from task.autoscrape (decorated)
    which is invoked ONLY via management/commands/autoscrape.py (a ScrapeTaskCommand)
    """

    with ScrapeTaskLogContext(options=options, task_args=task_args):
        count = options["count"]
        scraper = Scraper(options, verbosity=0, via="autoscrape")

        # get latest date to consider "recently scraped"
        frequency = options["frequency"]
        recent_rescrape_date = yesterday(frequency)
        logger.debug("%d days, recent %s", frequency, recent_rescrape_date)

        sources = Source.objects
        if options["all"]:
            logger.debug("%d total feeds", sources.count())
        else:
            collection_ids = monitored_collections()
            sources = sources.filter(collections__id__in=collection_ids)
            logger.debug("%d monitored collections; %d feeds", len(collection_ids), sources.count())

        if options["days_old"] is not None:
            days_old = options["days_old"]
            latest = yesterday(days_old)
            sources = sources.filter(created_at__gt=latest)
            logger.debug("max %d days old: %s", days_old, latest)

        # get least recently scraped sources first
        sources = sources.filter(Q(last_rescraped__lt=recent_rescrape_date) |
                                 Q(last_rescraped__isnull=True))\
                         .order_by(F("last_rescraped").asc(nulls_first=True))

        sssr = scraper.scrape_sources(sources, count)
        logger.info("Summary: %s", sssr.summary)
        logger.debug("chunks: <<<\n%s\n>>>", "\n".join(sssr.chunks))

    # end with TaskLogContext
