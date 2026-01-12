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
import numpy as np

from mcmetadata.feeds import normalize_url
from django.core.paginator import Paginator
from django.contrib.auth.models import User
#from django.db.models import Q
from django.utils import timezone

# mcweb/backend/util
from ..util.tasks import TaskLogContext, get_task_provider

# local directory: mcweb/backend/sources
from .action_history import ActionHistoryContext, _delegated_history, log_action
from .metadata_update import UPDATERS # map of fieldname to class to run
from .models import Source, Collection, ActionHistory
from .scrape import scrape_source, scrape_collection

# mcweb/backend/util
from backend.util.syslog_config import LOG_DIR
from backend.util.tasks import (
    SYSTEM_FAST,
    SYSTEM_SLOW,
    ADMIN_FAST,
    ADMIN_SLOW,
    TaskLogContext,
    background,
    return_error,
    return_task
)


ES_PROVIDER = "onlinenews-mediacloud"
ES_PLATFORM = "online_news"     # column in sources XXX get from model?

logger = logging.getLogger(__name__)

def yesterday():
    """
    used for ES search range (date only) end date
    """
    return dt.datetime.utcnow() - dt.timedelta(days=1)

# XXX reimplement as a metadata_update task?
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

@background(queue=SYSTEM_SLOW)
def metadata_update(*, username: str, long_task_name: str,
                    tasks: list[str], update: bool, provider: str, platform: str, rate: int, verbosity: int):
    with TaskLogContext(username=username, long_task_name=long_task_name):
        for updater in tasks:
            logger.info("=== start update %s %s", updater, dt.datetime.utcnow().isoformat())
            # XXX handle exceptions, so first doesn't kill the whole run?
            instance = UPDATERS[updater](provider, platform, 60 / rate, verbosity, update)
            instance.run()
            logger.info("=== end update %s %s", updater, dt.datetime.utcnow().isoformat())
