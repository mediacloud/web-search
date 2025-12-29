"""
Background tasks for "sources" app
(must be named tasks.py? next to app models.py??)
"""

# standard:
from collections import Counter
import datetime as dt
import logging
import json
import logging
import os
import time
import traceback
import types                    # for TracebackType
from typing import Dict, List, Tuple

# PyPI:
from mcmetadata.feeds import normalize_url
from django.core.management import call_command
from django.core.paginator import Paginator
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q, QuerySet
from django.utils import timezone
import numpy as np

from ..util.provider import get_task_provider

# mcweb/backend/sources
from .models import Feed, Source, Collection, ActionHistory
from .action_history import log_action
from .rss_fetcher_api import RssFetcherApi
from .action_history import ActionHistoryContext, _delegated_history

# mcweb/backend/util
from backend.util.tasks import (
    SYSTEM_FAST,
    SYSTEM_SLOW,
    ADMIN_FAST,
    ADMIN_SLOW,
    background,
    return_error,
    return_task
)

# mcweb/
from backend.util.syslog_config import LOG_DIR
from util.send_emails import send_alert_email, send_rescrape_email
from settings import (
    ADMIN_EMAIL,
    ADMIN_USERNAME,
    EMAIL_ORGANIZATION,
    RSS_FETCHER_PASS,
    RSS_FETCHER_URL,
    RSS_FETCHER_USER,
    EMAIL_NOREPLY,
    SCRAPE_ERROR_RECIPIENTS,
    SCRAPE_TIMEOUT_SECONDS
)

SCRAPE_FROM_EMAIL = EMAIL_NOREPLY

logger = logging.getLogger(__name__)

RESCRAPE_LOG_DIR = os.path.join(LOG_DIR, "rescrape")

class ScrapeContext:
    """
    context for rescrape tasks:
    Catch exceptions not otherwise handled.
    log everything to a named file (make optional?)
    send email!
    """
    # control logging with a constance setting?
    LOG_FILE = True

    def __init__(self, subject: str, email: str, what: str, id_: int):
        self.subject = subject
        self.email = email
        self.what = what
        self.id = id_
        self.handler: logging.Handler | None = None # log file
        self.recipients = [email]
        self.t0 = 0.0
        self.errors = False

    def __enter__(self) -> "ScrapeContext":
        self.t0 = time.monotonic()
        if self.LOG_FILE:
            if not os.path.exists(RESCRAPE_LOG_DIR):
                os.makedirs(RESCRAPE_LOG_DIR)

            date = time.strftime("%Y-%m-%d", time.gmtime())
            pid = os.getpid()
            email = self.email.replace(os.path.sep, "_")
            self.fname = f"{date}.{email or 'noname'}.{self.what}_{self.id}.pid_{pid}.log"
            path = os.path.join(RESCRAPE_LOG_DIR, self.fname)
            self.handler = logging.FileHandler(path)
            self.handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s"))
            self.handler.setLevel(logging.DEBUG)

            # add handler to root logger
            logging.getLogger('').addHandler(self.handler)
            logger.info("logging rescrape to %s", path) # path includes user, what, id

        self.body_chunks: list[str] = []

        # Create and activate ActionHistoryContext for logging feed discoveries
        # Look up User from email (or None if not found)
        try:
            user = User.objects.filter(email=self.email).first()
        except Exception:
            user = None
        
        # Determine object_model from what
        if self.what == "source":
            object_model = ActionHistory.ModelType.SOURCE
            # Fetch object to get name
            try:
                obj = Source.objects.get(id=self.id)
                object_name = obj.name or f"Source {self.id}"
            except Source.DoesNotExist:
                object_name = f"Source {self.id}"
        else:  # collection
            object_model = ActionHistory.ModelType.COLLECTION
            # Fetch object to get name
            try:
                obj = Collection.objects.get(id=self.id)
                object_name = obj.name or f"Collection {self.id}"
            except Collection.DoesNotExist:
                object_name = f"Collection {self.id}"
        
        # Create ActionHistoryContext
        self.action_history_ctx = ActionHistoryContext(
            user=user,
            action_type=f"rescrape-{self.what}",
            object_model=object_model,
            object_id=self.id,
            object_name=object_name,
            additional_changes={},
            notes=None  # Will be set in __exit__()
        )
        
        # Activate the context
        self.action_history_ctx.__enter__()

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
        sec = time.monotonic() - self.t0
        self.add_body_chunk(f"elapsed time: {sec:.3f} seconds\n")
        if type_:
            # should only get here with unhandled exceptions
            logger.exception("Exception for %s rescrape of %s %d (%.3f sec)",
                             self.email, self.what, self.id, sec)

        if type_ or self.errors:
            self.subject += " (WITH ERRORS)"

        # logs before and after:
        send_rescrape_email(f"[{EMAIL_ORGANIZATION}] {self.subject}",
                            self.body(), SCRAPE_FROM_EMAIL, self.recipients)

        if value:
            logger.error("ending rescrape log %s, Exception: %r", self.fname, value)
        else:
            logger.info("ending rescrape log %s (%.3f sec)", self.fname, sec)

        if self.handler:
            logging.getLogger('').removeHandler(self.handler)
            self.handler.close()
            self.handler = None

        # Update ActionHistoryContext with final summary and clean up
        if self.action_history_ctx:
            # Update notes with final summary
            summary_line = self.body_chunks[-1] if self.body_chunks else 'no details'
            self.action_history_ctx.notes = f"Rescrape completed: {summary_line}, initiated by {self.email}"
            
            # Update additional_changes if needed (e.g., feed counts could be extracted from body_chunks)
            # For now, just pass through - could be enhanced later
            
            # Call __exit__() to update parent with summary and clean up
            try:
                self.action_history_ctx.__exit__(None, None, None)
            except Exception as e:
                logger.error(f"Error cleaning up ActionHistoryContext: {e}", exc_info=True)

        return True             # suppress exception!!!!

def sources_task_user():
    """
    used in management command queuing call
    """
    return User.objects.get(username=ADMIN_USERNAME)

@background(queue=ADMIN_FAST)   # admin user initiated
def _scrape_source(source_id: int, homepage: str, name: str, user_email: str) -> None:
    logger.info("== starting _scrape_source %d (%s) %s for %s",
                source_id, name, homepage, user_email)

    subject = f"Source {source_id} ({name}) scrape complete"

    # ScrapeContext handles exceptions, sends mail!
    with ScrapeContext(subject, user_email, "source", source_id) as sc:
        sc.add_body_chunk(Source._scrape_source(source_id, homepage, name))

    
    logger.info(f"== finished _scrape_source {source_id} ({name}) {homepage} for {user_email}")
   


@background(queue=ADMIN_SLOW)   # admin user initiated
def _scrape_collection(collection_id: int, user_email: str) -> None:
    logger.info(f"==== starting _scrape_collection(%d) for %s",
                collection_id, user_email)

    errors = 0
    subject = f"Collection {collection_id} scrape complete"
    with ScrapeContext(subject, user_email, "collection", collection_id) as sc:
        collection = Collection.objects.get(id=collection_id)
        if not collection:
            # now checked in schedule_scrape_collection, so should not happen!
            logger.info("collection id %d not found", collection_id)
            sc.add_error(False)
            sc.add_body_chunk(f"collection {collection_id} not found")
            return

        sources = collection.source_set.all()
        for source in sources:
            logger.info(f"== starting Source._scrape_source %d (%s) in collection %d for %s",
                        source.id, source.name, collection_id, user_email)
            if source.url_search_string:
                sc.add_body_chunk(f"Skippped source {source.id} ({source.name}) with URL search string {source.url_search_string}\n")
                logger.warning(f"  Source %d (%s) has url_search_string %s",
                               source.id, source.name, source.url_search_string)
                continue

            try:
                # remove verbosity=0 for more output!
                sc.add_body_chunk(
                    Source._scrape_source(source.id, source.homepage, source.name, verbosity=0))
            except Exception as e:
                logger.exception("Source._scrape_source exception in _scrape_source %d for %s",
                                 source.id, user_email)
                sc.add_error()  # keep going

                # for debug (seeing where hung by ^C-ing under
                # dokku-scripts/outside/run-manage-pdb.sh)
                if isinstance(e, KeyboardInterrupt):
                    raise
            logger.info(f"== finished Source._scrape_source %d (%s) in collection %d %s for %s",
                        source.id, source.name, collection_id, collection.name, user_email)

        logger.info(f"==== finished _scrape_collection(%d, %s) for %s",
                    collection.id, collection.name, user_email)

        
    # end with ScrapeContext...


def monitored_collections():
    with open('mcweb/backend/sources/data/collections-to-monitor.json') as f:
        return json.load(f)

#def _rss_fetcher_api():
#    return RssFetcherApi(RSS_FETCHER_URL, RSS_FETCHER_USER, RSS_FETCHER_PASS)

ES_PROVIDER = "onlinenews-mediacloud"
ES_PLATFORM = "online_news"     # column in sources XXX get from model?
ES_SLEEP = 60 / 100             # 100 calls/minute

def yesterday():
    """
    used for ES search range (date only) end date
    """
    return dt.datetime.utcnow() - dt.timedelta(days=1)

@background(queue=SYSTEM_SLOW)
def alert_system(update):
    """
    monitor sources using ES 2D aggregation

    ignores "child sources" (with URL search strings)
    and alternate domain names (would effect batching,
    since source:domain would no longer be 1:1)
    """

    p = get_task_provider(provider_name=ES_PROVIDER,
                          task_name="alert-system")

    collection_ids = monitored_collections()

    alert_dict = {
        "high": [],
        "low": [],
        "fixed": []
    }
    reports = 0

    agg_interval = "day"
    num_intervals = 28
    last_week = -7

    # can only get ~64K buckets per provider call
    # so must limit the number of sources per call.
    batch_size = p.MAX_2D_AGG_BUCKETS // num_intervals

    # NOTE! Does not catch alternate domains!
    # would complicate ES query batching!!
    sources = Source.objects.filter(collections__id__in=collection_ids,
                                    platform=ES_PLATFORM,
                                    url_search_string__isnull=True)\
                            .order_by("id")\
                            .distinct()

    paginator = Paginator(sources, batch_size)

    for page_number in paginator.page_range:
        batch = paginator.page(page_number)

        agg = p.two_d_aggregation(end_date=yesterday(),
                                  interval="day",
                                  num_intervals=num_intervals,
                                  domains=[s.name for s in batch],
                                  inner_field="media_name")

        # dict indexed by date string, of dicts indexed by domain, of counts
        buckets = agg["buckets"]

        for source in batch:
            domain = source.name
            srcid = source.id
            changed = False

            counts = [bucket.get(domain, 0) for bucket in buckets.values()]
            if sum(counts) == 0:
                logger.info("Source %d: %s not returning stories", srcid, domain)
                if not source.alerted:
                    source.alerted = True
                    changed = True
            else:
                mean = np.mean(counts)
                std_dev = np.std(counts)

                week_counts = counts[last_week:]
                mean_last_week = np.mean(week_counts)
                sum_last_week = sum(week_counts)

                lower = mean - 1.5 * std_dev
                upper = mean + 2 * std_dev

                def report(level, msg):
                    """
                    update alert_dict used in alert-system.html template
                    """
                    nonlocal reports

                    alert_dict[level].append(msg) # depend on template for newlines
                    logger.info("%s (%.1f %.1f %.1f)", msg, lower, mean_last_week, upper)
                    reports += 1

                # moved inline to avoid updating row twice: remove model method???
                if source.stories_per_week != sum_last_week:
                    source.stories_per_week = sum_last_week
                    changed = True

                if mean_last_week < lower:
                    report("low", f"Source {srcid}: {domain} is returning LOWER than usual story volume")
                    if not source.alerted:
                        source.alerted = True
                        changed = True
                elif mean_last_week > upper:
                    report("high", f"Source {srcid}: {domain} is returning HIGHER than usual story volume")
                    if not source.alerted:
                        source.alerted = True
                        changed = True
                elif source.alerted:
                    report("fixed", f"Source {srcid}: {domain} was alerting before and is now fixed")
                    source.alerted = False
                    changed = True
                else:
                    logger.info(f"Source %d: %s is ingesting at regular levels", srcid, domain) #  XXX DEBUG?
            if changed and update:
                # XXX add to list and perform bulk_update at end???
                source.save()
    logger.info("alert_dict %r", alert_dict)
    if reports:
        send_alert_email(alert_dict)

#def update_stories_per_week():
#    user = User.objects.get(username=ALERTS_TASK_USERNAME)
#
#    task = _update_stories_counts(
#                        creator= user,
#                        verbose_name=f"update stories per week {dt.datetime.now()}")
#    return return_task(task)

@background(queue=SYSTEM_FAST)
def update_stories_per_week(update):
    logger.info("==== starting update_story_counts")

    sources = Source.objects.filter(name__isnull=False,
                                    platform=ES_PLATFORM,
                                    url_search_string__isnull=True)\
                            .order_by("id")

    p = get_task_provider(provider_name=ES_PROVIDER,
                          task_name="update-stories-per-week")

    # currently limited by number of boolean (OR) clauses
    batch_size = 32767
    paginator = Paginator(sources, batch_size)

    for page_number in paginator.page_range:
        batch = paginator.page(page_number)

        # really only need 1-D aggregation (by media_name)
        agg = p.two_d_aggregation(end_date=yesterday(),
                                  interval="week",
                                  num_intervals=1,
                                  domains=[s.name for s in batch],
                                  inner_field="media_name")

        # dict indexed by (single) date string, of dicts indexed by domain, of counts
        date_buckets = agg["buckets"]
        date = next(iter(date_buckets.keys())) # get only date!
        domains = date_buckets[date]

        for source in batch:
            domain = source.name
            srcid = source.id

            weekly_count = domains.get(domain, 0)
            print(srcid, domain, source.stories_per_week, weekly_count)
            if source.stories_per_week != weekly_count:
                logger.info("%s (%d): %d", domain, srcid, weekly_count)
                if update:
                    Source.update_stories_per_week(srcid, weekly_count) # XXX do batch update??!!!

        if ES_SLEEP > 0:
            time.sleep(ES_SLEEP)

def schedule_scrape_collection(collection_id, user):
    """
    call this function from a view action to schedule a (re)scrape for a collection
    """
    collection = Collection.objects.get(id=collection_id)
    if not collection:
        return return_error(f"collection {collection_id} not found")

    name_or_id = collection.name or str(collection_id)
    task = _scrape_collection(collection_id, user.email, creator=user, verbose_name=f"rescrape collection {name_or_id}")
    return return_task(task)


def schedule_scrape_source(source_id, user):
    """
    call this function from a view action to schedule a (re)scrape
    """
    source = Source.objects.get(id=source_id)
    if not source:
        return return_error(f"source {source_id} not found")

    if not source.homepage:
        return return_error(f"source {source_id} missing homepage")

    if source.url_search_string:
        return return_error(f"source {source_id} has url_search_string")

    # maybe check if re-scraped recently????

    name_or_home = source.name or source.homepage

    # NOTE! Will remove any other pending scrapes for same source
    # rather than queuing a duplicate; the new user will "steal" the task
    # (leaving no trace of the old one). Returns a Task object.
    task = _scrape_source(source_id, source.homepage, source.name, user.email,
                          creator=user,
                          verbose_name=f"rescrape source {name_or_home}")
    return return_task(task)

SOURCE_UPDATE_DAYS_BACK = 180  # Number of days to look back for story analysis
SOURCE_UPDATE_MIN_STORY_COUNT = 100 # Minimum number of stories required for a valid source
SOURCE_UPDATE_START_DATE = timezone.make_aware(dt.datetime(1950, 1, 1)) # Possible earliest source publication date, some sources report 1990s

def analyze_sources(provider_name: str, sources:List, start_date: dt.datetime, task_name: str) -> List[Dict[str, str]]:
    """
    Generalized function to analyze sources.
    Args:
        provider_name (str): The provider name.
        sources (List): The sources to process.
        start_date (dt.datetime): The start date for analysis.
        task_name (str): Task name based on param to update ("language" or "publication_date"). Used to create provider session.
    Returns:
        List[Dict[str, str]]: A list of dictionaries containing source IDs and their analyzed data.
    """
    user = User.objects.get(username=ANALYZE_TASK_USERNAME)
    END_DATE = timezone.now()
    updated_sources = []

    # getting canonical domain from urls.canonical_domain(homepage) makes a HTTP request, NOT IDEAL !!!
    if not sources:
        logger.info("No new sources to process.")
        return updated_sources

    # Pre-filter sources: Only keep those with records in Elasticsearch
    provider = get_task_provider(provider_name=provider_name, task_name=task_name)
    sources_with_records = []
    sources_with_no_records = []

    domain_search_string = provider.domain_search_string()
    for source in sources:
        query_str = f"{domain_search_string}:{source.name}"
        record_count = 0
        try:
            record_count = provider.count(query_str, start_date, END_DATE)
        except ProviderParseException:
            logger.warning("Failed to fetch record count from Elasticsearch")

        if record_count > 0:
            sources_with_records.append(source)
        else:
            sources_with_no_records.append(source.name)

    if sources_with_no_records:
        logger.info("No records found for the following sources in Elasticsearch: %s", sources_with_no_records)

    for source in sources_with_records:
        time.sleep(ES_SLEEP)
        try:
            query_str = f"{domain_search_string}:{source.name}"
            if task_name == "update_source_language":
                languages = provider.languages(query_str, start_date, END_DATE, limit=10)
                if not languages:
                    logger.warning("No languages found for source %s to analyze.",  source.name)
                    continue
                primary_language = max(languages, key=lambda x: x["value"])["language"]
                source.primary_language = primary_language
                logger.info("Analyzed source %s. Primary language: %s" % (source.name, primary_language))
                log_action(user,  "update-source-language", ActionHistory.ModelType.SOURCE, source.id, source.name)
                updated_sources.append(source)

            elif task_name == "update_publication_date":
                results = provider.count_over_time(query_str, start_date, END_DATE)
                if not results:
                    logger.warning("No publication dates found for source %s to analyze %s." % (source.name, task_name))
                    continue

                earliest_month = results["counts"][0]["date"]
                first_story = dt.datetime.combine(earliest_month, dt.datetime.min.time())
                if first_story:
                    first_story = timezone.make_aware(first_story)
                    if source.first_story is None or first_story < source.first_story:
                        source.first_story = first_story
                        logger.info("Analyzed source %s. First story publication date: %s" % (source.name, first_story))
                        log_action(user,  "update-source-pub-date", ActionHistory.ModelType.SOURCE, source.id, source.name)
                        updated_sources.append(source)

        except Exception as e:
            logger.error("Failed to analyze source %s: %s" % (source.name, str(e)))

    logger.info("Completed analysis for %d sources." % len(updated_sources))
    
    return updated_sources

def _get_min_update_date():
    min_date = timezone.now() - dt.timedelta(days=SOURCE_UPDATE_DAYS_BACK)
    min_date.replace(hour=23,minute=59,second=59)
    return min_date

@background(queue=SYSTEM_SLOW)
def update_source_language(provider_name:str, batch_size: int = 100) -> None:
    update = False              # XXX TEMP add argument

    sources = Source.objects.filter(primary_language__isnull=True,
                                    name__isnull=False,
                                    stories_per_week__gt=0)\
                            .order_by("id")

    p = get_task_provider(provider_name=ES_PROVIDER,
                          task_name="update-source-language")

    start_date = _get_min_update_date()
    end_date = timezone.now()

    # currently limited by number of boolean (OR) clauses
    batch_size = 32767
    paginator = Paginator(sources, batch_size)

    for page_number in paginator.page_range:
        batch = paginator.page(page_number)

        # really only need 1-D aggregation (by media_name)
        agg = p.two_d_aggregation(start_date=start_date,
                                  end_date=end_date,
                                  domains=[s.name for s in batch],
                                  outer_field="media_name",
                                  inner_field="language",
                                  max_inner_buckets=1)

        # dict indexed by domain name, of dicts indexed by language, of counts
        domains = agg["buckets"]
        print("domains", domains)
        for source in batch:
            domain = source.name
            srcid = source.id

            langs = domains.get(domain, {})
            if langs:
                lang = next(iter(langs.keys())) # get only language!
                logger.info("%s (%d): %s", domain, srcid, lang)
                if False:
                    source.primary_language = lang
                    # XXX save in list, do bulk update
                    source.save()

        if ES_SLEEP > 0:
            time.sleep(ES_SLEEP)

@background(queue=SYSTEM_SLOW)
def update_publication_date(provider_name:str, batch_size: int = 100) -> None:
    last_seen_id = 0
    while True:
        # Fetch all sources with a name. first_publication_date may change as older stories are ingested.
        sources_for_publication_date = list(Source.objects.filter(name__isnull=False, id__gt=last_seen_id)\
                                           .order_by("id")[:batch_size])

        if not sources_for_publication_date:
            logger.info("No new sources to process for publication date analysis.")
            break

        analyzed_sources = analyze_sources(provider_name, sources_for_publication_date, SOURCE_UPDATE_START_DATE, "update_publication_date")
        with transaction.atomic():
            if analyzed_sources:
                Source.objects.bulk_update(analyzed_sources, ["first_story"])
                logger.info("Bulk updated first_story for %d sources." % len(analyzed_sources))

            Source.objects.filter(id__in=[s.id for s in sources_for_publication_date]).update(modified_at=timezone.now())
        last_seen_id = sources_for_publication_date[-1].id
