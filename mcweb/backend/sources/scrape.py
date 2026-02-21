"""
Feed scraping code

Beware all ye who enter here:

This code has evolved through REPEATED evolutionary reworks,
so it's less than perfectly lovely.

AND this could very well be fruitful grounds for continued work:
* We try CONSIDERABLY harder to fetch known feeds and stories.
* No effort is made here to detect and report systemic connection errors
* Even autoscrape is a one-time, best-effort event with no retry.

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
import time                     # sleep
import traceback                # format_exc
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
from mc_sitemap_tools.crawl import GNewsCrawler, VisitResult

# local directory mcweb/backend/sources
from .action_history import ActionHistoryContext, log_action
from .models import ActionHistory, Collection, Feed, Source
from .task_utils import monitored_collections, yesterday_aware

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

class ScrapeTaskCommand(TaskCommand):
    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true",
                            help="Disable scraping, updating.")
        super().add_arguments(parser)

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
    duplicate: int = 0          # duplicate new feeds
    preexisting: int = 0        # insert failed (duplicate URL)

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

# handling argument for _add_source_line
_L_ALWAYS = 0o1
_L_INDENT = 0o2
# use one of these:
L_HEADER = _L_ALWAYS
L_SUMMARY = _L_ALWAYS + _L_INDENT
L_DETAIL = _L_INDENT

class Scraper:
    """
    encapsulate scraping state
    """
    def __init__(self, options: dict, *, via: str, detail: bool = False, try_harder: bool = False):
        """
        options: dict of kwargs from ScrapeTaskCommand
                (or forged by schedule_scrape_XXX in tasks.py)
                must include "user"
        via: string indicating task type (and object id) for ActionHistory
        detail: if True, show individual feeds added in per-source "chunk" (for email)
        try_harder: if True, take longer, try harder
        """
        self.options = options
        self.errors = False
        self.detail = detail # False for batches/collections
        self.via = via
        self.try_harder = try_harder

        self.timeout = SCRAPE_TIMEOUT_SECONDS

        # max_depth: max crawler depth (one means look at files referenced by robots.txt,
        #       but not index pages referenced by index pages). Now immediately punts on an
        #       index file if we won't visit the resulting URLs.
        self.max_depth = 1
        if self.try_harder:
            self.timeout *= 3.0
            # upping to three showed little/no benefit in initial testing,
            # and _could_ exponentially expand work, so being cautious:
            self.max_depth = 2
        # for ActionHistory entries:
        self.user = User.objects.get(username=options["user"]) # may raise exception!
        # Use verbosity to enable/disable info & debug level logging??
        #self.verbosity = options.get("verbosity", 0) # command line --verbosity
        self.delay = 1 / 20 # max 20/second

        self._reset_source([])

    def _reset_source(self, all_old_urls: list[str]):
        # reset per source
        # (could belong in a SourceScraper class, but trying to avoid that!)
        self.source_lines = []

        self._feed_counts = FeedCounts()
        self._feed_counts.old = len(all_old_urls)
        self.old_urls = {normalize_url(url) for url in all_old_urls}
        self.new_urls = set()

        # Keep GNewsCrawler on hand for the duration of scraping
        # a source to avoid visiting a given sitemap more than
        # once when trying different home pages.

        # GNewsCrawler heuristics have gotten better (both via
        # regexps of urls to skip, and max_non_news_urls which
        # makes visiting uninteresting pages faster). HOWEVER,
        # we don't want to spend unlimited time on any one site,
        # and the autoscraper even less so.

        # BUT, before raising any of these in production, do some
        # autoscraping to see if there are any pitfalls!!

        # univision.com is current record holder with three active pages.
        # having this greater than one means having to crawl more (or all) of the site.
        max_results = 3

        # Prevent parsing HUGE (50MB) files that show zero promise.
        # https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
        # says "... a sitemap may have up to 1,000 news:news tags", and we're hoping for
        # files with nuthin' but news, so punt "early" if no news tags seen.
        # Parsing 5k entries taking about 600ms on ifill.
        max_non_news_urls = 5000

        self.gnews_crawler = GNewsCrawler(
            user_agent=MEDIA_CLOUD_USER_AGENT,
            max_depth=self.max_depth,
            max_results=max_results,
            max_non_news_urls=max_non_news_urls)


    def _add_source_line(self, line: str, handling: int = L_DETAIL):
        """
        loging everything to leave trail in log file
        DON'T want newline in logged message!
        handling: one of L_HEADER, L_SUMMARY, L_DETAIL
        """
        if line and line[-1] == "\n":
            line = line[:-1]
        if handling & _L_INDENT:
            line = "  " + line
        logger.info(">>%s", line) # drop reeces pieces in log file
        if (handling & _L_ALWAYS) or self.detail:
            self.source_lines.append(line)

    def _make_source_chunk(self):
        """
        make a chunk of text (paragraph) from lines generated from scraping a source
        first line is not indented, following lines are.
        """
        self.source_lines.append("") # ensure trailing newline
        chunk = "\n".join(self.source_lines)
        self.source_lines = []
        return chunk

    def rss_page_fetcher(self, url: str) -> str:
        """
        custom fetcher for RSS pages for feed_seeker
        (adapted from from feed_seeker default_fetch_function)
        """
        logger.debug("rss_page_fetcher %s", url)
        session = insecure_requests_session(MEDIA_CLOUD_USER_AGENT)
        # XXX time.sleep(self.delay) to rate limit??
        try:
            # provide connection and read timeouts in case alarm based timeout fails
            # (scrapes sometimes hang).

            response = session.get(url, timeout=(self.timeout, self.timeout))
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


    def _scrape_source3(self, source_id: int, homepage: str, name: str):
        """
        helper for _scrape_source2; may be called more than once per source
        """
        # Look for RSS feeds
        try:
            new_feed_generator = feed_seeker.generate_feed_urls(
                homepage, max_time=self.timeout, fetcher=self.rss_page_fetcher)
            # create list so DB operations in process_urls are not under the timeout gun.
            self._process_urls(source_id, homepage, "rss", new_feed_generator)
        except requests.RequestException as e: # maybe just catch Exception?
            self._add_source_line(f"fatal error for rss: {e!r}")
            logger.warning("generate_feed_urls(%s): %r", homepage, e)
        except TimeoutError:
            self._add_source_line("timeout for rss")
            logger.warning("generate_feed_urls(%s): timeout", homepage)

        # Look for Google News Sitemaps (does not YET do full site crawl)
        gnews_urls = []
        GNEWS = "news sitemap" # say something once, why say it again?

        try:
            gnc = self.gnews_crawler # kept across calls
            gnc.start(homepage)
            while gnc.visit_one(timeout=self.timeout) == VisitResult.MORE:
                time.sleep(self.delay)
            gnews_urls = [m["url"] for m in gnc.results]
        except requests.RequestException as e:
            # format repr(e), limit to 1024 characters
            self._add_source_line(f"fatal error for {GNEWS} discovery: {e!r:.1024}")
            logger.exception("GNewsCrawler")

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
            if nurl in self.new_urls:
                self._add_source_line(f"duplicate {from_} feed {url}")
                self._feed_counts.duplicate += 1
            elif nurl in self.old_urls:
                self._add_source_line(f"confirmed {from_} feed {url}")
                self._feed_counts.confirmed += 1
            else:
                try:
                    feed = Feed(source_id=source_id, admin_rss_enabled=True, url=url)
                    feed.save()

                    self._add_source_line(f"added {from_} feed {url}")

                    logger.info("scrape_source(%d, %s) added %s feed %s",
                                source_id, homepage, from_, url)

                    # create ActionHistory row: will be child of SOURCE entry
                    log_action(self.user, "create", ActionHistory.ModelType.FEED, feed.id,
                               object_name=url, notes=f"{from_} feed via {self.via} for {self.user.username}")

                    self.new_urls.add(nurl) # avoid trying to add twice
                    self._feed_counts.added += 1
                except IntegrityError:
                    # happens when feed exists
                    try:
                        # url is a unique key, should not get more than one!
                        ofeed = Feed.objects.filter(url=url).first()
                        ofeed_src = f"source {ofeed.source.id} ({ofeed.source.name})"
                    except Feed.DoesNotExist:
                        ofeed_src = "unknown source!!"
                    self._add_source_line(f"{from_} feed {url} exists in {ofeed_src}")
                    logger.warning("process_urls(%d, %s) duplicate %s feed %s (exists in %s)",
                                   source_id, homepage, from_, url, ofeed_src)
                    self._feed_counts.preexisting += 1
        # end _process_feeds

    def _scrape_source2(self, source_id: int, homepage: str, name: str) -> None:
        """
        called from _scrape_source()
        called once per source, here to avoid double indent,
        and make scrape_source call as clear as possible
        """
        logger.debug("_scrape_source2 %d %s %s", source_id, homepage, name)

        if homepage:
            # XXX try validating home page? starts with http(s)://valid.do.ma.in??
            self._scrape_source3(source_id, homepage, name)

        # homepage might be totally bogus!
        # if no feeds found, try harder:
        # maybe always if self.try_harder set?
        # www.DOMAIN _slightly_ more common as homepage, so try bare domain
        if (self._feed_counts.total == 0 and
            homepage != f"http://{name}" and
            homepage != f"https://{name}"):
            self._scrape_source3(source_id, f"http://{name}", name)

        # XXX if still zero try www.{name}?? (make above into local function that formats/checks urls)

        # XXX if nothing found, try feedly????

    def scrape_source(self, source_id: int, homepage: str, name: str, extra: str = "") -> ScrapeSourceResult:
        """
        called for single source, and by scrape_sources
        """
        # NOTE! want feed URLs regardless of whether disabled
        all_old_urls = [feed.url for feed in Feed.objects.filter(source_id=source_id)]
        self._reset_source(all_old_urls)

        logger.debug("scraping %s: timeout %.1f max_depth %d delay %.3f",
                     name, self.timeout, self.max_depth, self.delay)

        # per-source header line: always included
        self._add_source_line(f"Scraped source {source_id} ({name}){extra}", handling=L_HEADER)

        dry_run = self.options.get("dry_run", False)
        if dry_run:
            summary = "skipped"
        else:
            # will be parent event for Feed create events:
            # turn "scrape source n" or "scrape collection n" into scrape-thing,
            # leaves "autoscrape" alone:
            action_type = "-".join(self.via.split()[:2])
            with ActionHistoryContext(
                    user=self.user,
                    action_type=action_type,
                    object_model=ActionHistory.ModelType.SOURCE,
                    object_id=source_id,
                    object_name=name,
                    notes=f"started via {self.via} for {self.user.username}"
            ) as ahc:
                self._scrape_source2(source_id, homepage, name)
                summary = self._feed_counts.summary()
                Source.update_last_rescraped(source_id=source_id, summary=summary)
                ahc.notes = f"{summary} via {self.via} for {self.user.username}"

        self._add_source_line(summary, handling=L_SUMMARY)

        return ScrapeSourceResult(
            full=self._make_source_chunk(),
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

        # scraping single source, so include added feed urls in email text,
        # increase timeouts for best chance of success.
        # XXX See if increasing max_depth helps???
        scraper = Scraper(options, via=f"scrape source {source_id}",
                          detail=True, try_harder=True)
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
        scraper = Scraper(options, via=f"scrape collection {collection_id}")

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
        scraper = Scraper(options=options, via="autoscrape")

        # get latest date to consider "recently scraped"
        frequency = options["frequency"]
        recent_rescrape_date = yesterday_aware(frequency)
        logger.debug("%d days, recent %s", frequency, recent_rescrape_date)

        sources = Source.objects
        if options["all"]:
            logger.debug("%d total feeds", sources.count())
        else:
            collection_ids = monitored_collections()
            sources = sources.filter(collections__id__in=collection_ids)
            logger.debug("%d monitored collections; %d sources", len(collection_ids), sources.count())

        if options["days_old"] is not None:
            days_old = options["days_old"]
            latest = yesterday_aware(days_old)
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
