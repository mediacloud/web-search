import logging
import types                    # TracebackType

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
    # control logging with a constance setting?
    LOG_FILE = True

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

    def add_error(self, exception: bool = True):
        """
        add ADMIN_EMAIL & users in SCRAPE_ERROR_RECIPIENTS to recipients
        """
        if exception:
            self.add_body_chunk(f"ERROR:\n{traceback.format_exc()}") # format_exc has final newline
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

def _scrape_source(source_id: int, homepage: str, name: str, initiator: str, verbosity: int = 1) -> tuple[str, str, int]:
    """
    helper routine, was Source static method,
    extracted to be close to only users.
    Maybe turn into a class to turn process_urls into a method (avoid nonlocal)??

    returns tuple with (text for email, one line summary, feeds added)

    XXX return Counter instead of "added" count and summary line???
    XXX refactor into inner function invoked with both homepage and http://www.NAME
        (and maybe keep track of sources already scraped for autoscraping?)

    NOTE: reported counts can be odd looking with duplicate URLs
    """
    # create dict of full urls of current feeds indexed by normalized urls
    old_urls = {normalize_url(feed.url): feed.url
                for feed in Feed.objects.filter(source_id=source_id)}
    old = len(old_urls)
    feeds_added = 0

    # NOTE! Each line appended to list must end with a newline!
    lines = []
    def add_line(line):
        logger.debug("add_line: %s", line.rstrip()) # without newlines!
        if not line.endswith("\n"):
            line += "\n"
        lines.append(line)

    # per-source header line
    add_line(f"Scraped source {source_id} ({name}), {homepage}")

    if not homepage:
        error = "MISSING HOMEPAGE"
        add_line(error)
        mail_text =  "".join(lines) # error not indented
        return mail_text, error, 0

    total = added = confirmed = 0
    def process_urls(from_: str, urls: list[str]):
        nonlocal total, added, confirmed
        for url in urls:
            total += 1
            nurl = normalize_url(url)
            if nurl in old_urls:
                if verbosity >= 1:
                    add_line(f"found existing {from_} feed {url}")
                logger.info(f"scrape_source(%d, %s) found existing %s feed %s",
                            source_id, homepage, from_, url)
                confirmed += 1
            else:
                try:
                    feed = Feed(source_id=source_id, admin_rss_enabled=True, url=url)
                    feed.save()
                    print("XXX create ActionHistory entry here??")
                    add_line(f"added new {from_} feed {url}")
                    logger.info("scrape_source(%d, %s) added new %s feed %s",
                                source_id, homepage, from_, url)

                    # try to prevent trying to adding twice
                    # (but may make counts come out funny!)
                    old_urls[nurl] = url
                    added += 1
                except IntegrityError:
                    # happens when feed exists, but under a different source!
                    # could do lookup by URL, and report what source (name & id) it's under....
                    add_line(f"{from_} feed {url} exists under some other source!!!")
                    logger.warning("_scrape_source(%d, %s) duplicate %s feed %s (exists under another source?)",
                                   source_id, homepage, from_, url)
                    # XXX increment duplicate counter?

        # end process_feeds

    # Look for RSS feeds
    try:
        new_feed_generator = feed_seeker.generate_feed_urls(
            homepage, max_time=SCRAPE_TIMEOUT_SECONDS, fetcher=rss_page_fetcher)
        # create list so DB operations in process_urls are not under the timeout gun.
        process_urls("rss", list(new_feed_generator))
    except requests.RequestException as e: # maybe just catch Exception?
        add_line(f"fatal error for rss: {e!r}")
        logger.warning("generate_feed_urls(%s): %r", homepage, e)
    except TimeoutError:
        add_line(f"timeout for rss")
        logger.warning("generate_feed_urls(%s): timeout", homepage)

    # Do quick look for Google News Sitemaps (does NOT do full site crawl)
    gnews_urls = []
    sitemaps = "news sitemap" # say something once, why say it again?

    try:
        nd = NewsDiscoverer(MEDIA_CLOUD_USER_AGENT)
        gnews_urls = nd.find_gnews_fast(homepage, timeout=SCRAPE_HTTP_SECONDS)
    except requests.RequestException as e:
        add_line(f"fatal error for {sitemaps} discovery: {e!r}")
        logger.exception("find_gnews_fast")

    if gnews_urls:
        process_urls(sitemaps, gnews_urls)

    # after many tries to give a summary in english
    # NOTE! duplicates can make the numbers seem incongruous!
    summary = f"{added}/{total} added, {confirmed}/{old} confirmed"
    add_line(summary)
    logger.info("%s", summary)
    # add last time this source was rescraped
    Source.update_last_rescraped(source_id=source_id, summary=summary)

    indent = "  "           # not applied to header line
    return indent.join(lines), summary, added

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

        logger.info("== starting _scrape_source %d (%s) %s for %s",
                    source_id, name, homepage, email)

        chunk, summary, added = _scrape_source(source_id, homepage, name, email)
        sc.add_body_chunk(chunk)

        logger.info(f"== finished _scrape_source %d (%s) %s for %s",
                    source_id, name, homepage, email)


# NOTE! If arguments added, need to adjust both
# tasks.shedule_scrape_collection AND management/commands/scrape-collection.py
def scrape_collection(*, options: dict, task_args: dict,
                     collection_id: int, email: str) -> None:
    """
    invoked only from task.scrape_collection (decorated)

    XXX split out _scrape_collection to be called by auto_scrape,
    XXX make worker a method on Scraper class? or make worker take in/out set of completed
    """

    with ScrapeContext(
            options=options, task_args=task_args,
            subject=f"Collection {collection_id} scrape complete",
            email=email,
            what="collection", id=collection_id) as sc, \
        ActionHistoryContext(
            user=User.objects.get(username=options["user"]),
            action_type="rescrape-collection",
            object_model=ActionHistory.ModelType.COLLECTION,
            object_id=collection_id,
            object_name=f"Collection {collection_id}",
            additional_changes={},
            note=None) as ahc:

        logger.info("==== starting scrape_collection(%d) for %s",
                        collection_id, email)

        # will raise exception if not found, so inside ScrapeContext for logging
        collection = Collection.objects.get(id=collection_id)

        sources = collection.source_set.all()
        processed = feeds_added = skipped = exceptions = 0

        for source in sources:
            processed += 1
            if source.url_search_string:
                sc.add_body_chunk(f"Skippped source {source.id} ({source.name}) with URL search string {source.url_search_string}\n")
                logger.info("  Source %d (%s) has url_search_string %s",
                            source.id, source.name, source.url_search_string)
                skipped += 1
                continue

            logger.info("== starting _scrape_source %d (%s) in collection %d for %s",
                        source.id, source.name, collection_id, email)
            try:
                # remove verbosity=0 for more output!
                chunk, summary, new = _scrape_source(source.id, source.homepage, source.name, email, verbosity=0)
                feeds_added += new
                sc.add_body_chunk(chunk)
            except Exception as e:
                exceptions += 1
                logger.exception("_scrape_source exception in _scrape_source %d for %s",
                                 source.id, email)
                sc.add_error()  # keep going

                # for debug (seeing where hung by ^C-ing under
                # dokku-scripts/outside/run-manage-pdb.sh)
                if isinstance(e, KeyboardInterrupt):
                    raise
            logger.info("== finished _scrape_source %d (%s) in collection %d %s for %s",
                        source.id, source.name, collection_id, collection.name, email)

        summary = f"{processed} sources processed: {feeds_added} feeds added, {skipped} srcs skipped, {exceptions} exceptions)"
        sc.add_body_chunk(summary)

        # XXX pass a Counter as additional_data instead of formatted summary?
        ahc.notes = f"Rescrape completed: {summary}, initiated by {email}"

        logger.info("==== finished _scrape_collection(%d, %s) for %s (%s)",
                    collection.id, collection.name, email, summary)
    # end with ScrapeContext, ActionHistoryContext
