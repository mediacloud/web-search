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

from django.utils.timezone import make_aware
from mc_providers.exceptions import ProviderParseException
# PyPI:
from mcmetadata.feeds import normalize_url
from django.core.management import call_command
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q, QuerySet
from django.utils import timezone
import numpy as np
from more_itertools.more import first

from ..util.provider import get_task_provider

# mcweb/backend/sources
from .models import Feed, Source, Collection
from .rss_fetcher_api import RssFetcherApi

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

ALERT_LOW = 'alert_low'
GOOD = 'good'
ALERT_HIGH = 'alert_high'

ALERTS_TASK_USERNAME = ADMIN_USERNAME
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

        return True             # suppress exception!!!!

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


def run_alert_system():
    user = User.objects.get(username=ALERTS_TASK_USERNAME)
    with open('mcweb/backend/sources/data/collections-to-monitor.json') as collection_ids:
        collection_ids = collection_ids.read()
        collection_ids = json.loads(collection_ids)

    task = _alert_system(collection_ids,
                        creator= user,
                        verbose_name=f"source alert system {dt.datetime.now()}",
                        remove_existing_tasks=True)
    return return_task(task)

def _rss_fetcher_api():
    return RssFetcherApi(RSS_FETCHER_URL, RSS_FETCHER_USER, RSS_FETCHER_PASS)

@background(queue=SYSTEM_SLOW)
def _alert_system(collection_ids):
        sources = set()
        for collection_id in collection_ids:
            try:
                collection = Collection.objects.get(pk=collection_id)
                source_relations = set(collection.source_set.all())
                sources = sources | source_relations
            except:
                print(collection_id)

        with _rss_fetcher_api() as rss:
        # stories_by_source = rss.stories_by_source() # This will generate tuples with (source_id and stories_per_day)

            email="test"
            alert_dict = {
                "high": [],
                "low": [],
                "fixed": []
            }
            no_stories_alert = 0
            low_stories_alert = 0
            high_stories_alert = 0
            fixed_source = 0
            for source in sources:
                stories_fetched = rss.source_stories_fetched_by_day(source.id)
                # print(stories_fetched)
                counts = [d['stories'] for d in stories_fetched]  # extract the count values
                if not counts:
                    # email += f"\n Source {source.id}: {source.name} is NOT FETCHING STORIES, please check the feeds \n"
                    no_stories_alert += 1
                    source.alerted = True
                    continue
                mean = np.mean(counts)
                std_dev = np.std(counts)

                last_7_days_data = stories_fetched[-7:]
                seven_day_counts = [d['stories'] for d in last_7_days_data]
                mean_last_week = np.mean(seven_day_counts)
                sum_count_week = _calculate_stories_last_week(stories_fetched)  #calculate the last seven days of stories
                Source.update_stories_per_week(source.id, sum_count_week)

                alert_status = _classify_alert(mean, mean_last_week, std_dev)

                if alert_status == ALERT_LOW:
                    alert_dict["low"].append(f"Source {source.id}: {source.name} is returning LOWER than usual story volume \n")
                    email += f"Source {source.id}: {source.name} is returning LOWER than usual story volume \n"
                    low_stories_alert += 1
                    source.alerted = True
                elif alert_status == ALERT_HIGH:
                    alert_dict["high"].append(f"Source {source.id}: {source.name} is returning HIGHER than usual story volume \n")
                    email += f"Source {source.id}: {source.name} is returning HIGHER than usual story volume \n"
                    high_stories_alert += 1
                    source.alerted = True
                else:
                    if source.alerted:
                         alert_dict["fixed"].append(f"Source {source.id}: {source.name} was alerting before and is now fixed \n")
                         fixed_source += 1
                         source.alerted = False
                    logger.info(f"=====Source {source.name} is ingesting at regular levels")
                # stories_published = rss.source_stories_published_by_day(source.id)
                # counts_published = [d['count'] for d in stories_published]
                # mean_published = np.mean(counts_published)
                # std_dev_published = np.std(counts_published)
                source.save()
            print(alert_dict)
            if(email):
                # email += f"NOT FETCHING STORIES count = {no_stories_alert} \n"
                email += f"HIGH ingestion alert count = {high_stories_alert} \n"
                email += f"LOW ingestion alert count = {low_stories_alert} \n"
                email += f"FIXED source count = {fixed_source} \n"
                send_alert_email(alert_dict)

def _classify_alert(month_mean, week_mean, std_dev):
    lower_range = std_dev * 1.5
    upper_range = std_dev * 2
    lower = month_mean - lower_range
    upper = month_mean + upper_range
    if week_mean < lower:
        return ALERT_LOW
    elif week_mean > upper:
        return ALERT_HIGH
    elif week_mean > lower and week_mean < upper:
        return GOOD

def update_stories_per_week():
    user = User.objects.get(username=ALERTS_TASK_USERNAME)

    task = _update_stories_counts(
                        creator= user,
                        verbose_name=f"update stories per week {dt.datetime.now()}",
                        remove_existing_tasks=True)
    return return_task(task)

@background(queue=SYSTEM_FAST)
def _update_stories_counts():
        with _rss_fetcher_api() as rss:
            stories_by_source = rss.stories_by_source() # This will generate tuples with (source_id and stories_per_day)
            for source_tuple in stories_by_source:
                source_id, stories_per_day = source_tuple
                weekly_count = int(stories_per_day * 7)
                print(source_id, stories_per_day, weekly_count)
                Source.update_stories_per_week(int(source_id), weekly_count)

def _calculate_stories_last_week(stories_fetched):
    """
    helper to calculate update stories per week count by fetching last 7 days count from stories_fetched
    """
    last_7_days_data = stories_fetched[-7:]
    sum_count = sum(day_data['stories'] for day_data in last_7_days_data)
    return sum_count

def schedule_scrape_collection(collection_id, user):
    """
    call this function from a view action to schedule a (re)scrape for a collection
    """
    collection = Collection.objects.get(id=collection_id)
    if not collection:
        return return_error(f"collection {collection_id} not found")

    name_or_id = collection.name or str(collection_id)
    task = _scrape_collection(collection_id, user.email, creator=user, verbose_name=f"rescrape collection {name_or_id}", remove_existing_tasks=True)
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
                          verbose_name=f"rescrape source {name_or_home}",
                          remove_existing_tasks=True)
    return return_task(task)

SOURCE_UPDATE_DAYS_BACK = 180  # Number of days to look back for story analysis
SOURCE_UPDATE_MIN_STORY_COUNT = 100 # Minimum number of stories required for a valid source
SOURCE_UPDATE_START_DATE = timezone.make_aware(dt.datetime(1950, 1, 1)) # Possible earliest source publication date, some sources report 1990s

def analyze_sources(provider_name: str, sources:QuerySet, start_date: dt.datetime, task_name: str) -> List[Dict[str, str]]:
    """
    Generalized function to analyze sources.
    Args:
        provider_name (str): The provider name.
        sources (QuerySet): The sources to process.
        start_date (dt.datetime): The start date for analysis.
        task_name (str): Task name based on param to update ("language" or "publication_date"). Used to create provider session.
    Returns:
        List[Dict[str, str]]: A list of dictionaries containing source IDs and their analyzed data.
    """
    END_DATE = timezone.now()
    updated_sources = []
    sleep_interval = 60 / 100

    # getting canonical domain from urls.canonical_domain(homepage) makes a HTTP request, NOT IDEAL !!!
    if not sources:
        logger.info("No new sources to process.")
        return updated_sources

    # Pre-filter sources: Only keep those with records in Elasticsearch
    provider = get_task_provider(provider_name=provider_name, task_name=task_name)
    sources_with_records = []
    sources_with_no_records = []

    domain_search_string = provider.domain_search_string()
    for source in sources.iterator():
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
        time.sleep(sleep_interval)  # Sleep for 0.6 seconds between requests
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
def update_source_language(provider_name:str, batch_size: int = 100 ) -> None:
    six_months_ago = _get_min_update_date()
    processed_source_ids = set()
    while True:
        sources_for_language = Source.objects.filter(primary_language__isnull=True, name__isnull=False)\
                                   .exclude(id__in=processed_source_ids).order_by("modified_at")[:batch_size]

        if not sources_for_language.exists():
            logger.info("No new sources to process for language analysis.")
            break

        analyzed_sources = analyze_sources(provider_name, sources_for_language, six_months_ago, "update_source_language")
        with transaction.atomic():
            if analyzed_sources:
                Source.objects.bulk_update(analyzed_sources, ["primary_language"])
                logger.info("Bulk updated primary_language for %d sources." % len(analyzed_sources))

            Source.objects.filter(id__in=[s.id for s in sources_for_language]).update(modified_at=timezone.now())
        processed_source_ids.update(s.id for s in sources_for_language)


@background(queue=SYSTEM_SLOW)
def update_publication_date(provider_name:str, batch_size: int = 100) -> None:
    processed_source_ids = set()
    while True:
        # Fetch all sources with a name. first_publication_date may change as older stories are ingested.
        sources_for_publication_date = Source.objects.filter(name__isnull=False)\
                                           .exclude(id__in=processed_source_ids).order_by("modified_at")[:batch_size]

        if not sources_for_publication_date.exists():
            logger.info("No new sources to process for publication date analysis.")
            break

        analyzed_sources = analyze_sources(provider_name, sources_for_publication_date, SOURCE_UPDATE_START_DATE, "update_publication_date")
        with transaction.atomic():
            if analyzed_sources:
                Source.objects.bulk_update(analyzed_sources, ["first_story"])
                logger.info("Bulk updated first_story for %d sources." % len(analyzed_sources))

            Source.objects.filter(id__in=[s.id for s in sources_for_publication_date]).update(modified_at=timezone.now())
        processed_source_ids.update(s.id for s in sources_for_publication_date)
