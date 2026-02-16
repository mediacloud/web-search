"""
Background tasks for "sources" app

(almost) only decorated functions defined in other files
to keep files just a few pages long.

NOTE!  All system tasks that do big ES queries now run in SYSTEM_FAST
queue.  They all currently run in less than an hour, and keeping them
in one queue avoids more than one at a time.  SYSTEM_SLOW is used for
the autoscraper, which runs for multiple hours, without using ES.
"""

# standard:
import logging

# PyPI:
import numpy as np

from django.contrib.auth.models import User

# local directory: mcweb/backend/sources
from . import alerts
from . import scrape
from . import metadata_update
from . import misc_tasks
from .models import Source, Collection

# mcweb/backend/util
from backend.util.syslog_config import LOG_DIR
from backend.util.tasks import (
    SYSTEM_FAST,
    SYSTEM_SLOW,
    ADMIN_FAST,
    ADMIN_SLOW,
    background,
    return_error,
    return_task
)


logger = logging.getLogger(__name__)


# called from management/commands/source-alert-system.py
# (via MetadataUpdaterCommand.run_task)
@background(queue=SYSTEM_FAST)  # run via periodic script
def alert_system(**kws):
    alerts.alert_system(**kws)

@background(queue=ADMIN_FAST)   # admin user initiated
def scrape_collection(**kws):
    scrape.scrape_collection(**kws)

def schedule_scrape_collection(collection_id, user: User):
    """
    called from a view action to schedule a (re)scrape for a collection
    """
    collection = Collection.objects.get(id=collection_id)
    if not collection:
        return return_error(f"collection {collection_id} not found")

    long_name = f"rescrape collection {collection_id}"
    task = scrape_collection(options={"user": user.username},
                             task_args={"long_task_name": long_name},
                             collection_id=collection_id, email=user.email,
                             # for bg tasks table:
                             creator=user,
                             verbose_name=long_name)
    return return_task(task)


@background(queue=ADMIN_FAST)   # admin user initiated
def scrape_source(**kws):
    scrape.scrape_source(**kws)

@background(queue=SYSTEM_SLOW)  # periodic, multi-hour runs (no ES)
def autoscrape(**kws):
    scrape.autoscrape(**kws)

def schedule_scrape_source(source_id, user: User):
    """
    called from a view action to schedule a (re)scrape
    NOT A TASK!
    """
    source = Source.objects.get(id=source_id)
    if not source:
        return return_error(f"source {source_id} not found")

    if not source.homepage:
        return return_error(f"source {source_id} missing homepage")

    if source.url_search_string:
        return return_error(f"source {source_id} has url_search_string")

    # maybe check if re-scraped recently????

    long_name = f"rescrape source {source_id}"

    # NOTE! Will remove any other pending scrapes for same source
    # rather than queuing a duplicate; the new user will "steal" the task
    # (leaving no trace of the old one). Returns a Task object.
    task = scrape_source(options={"user": user.username},
                         task_args={"long_task_name": long_name},
                         source_id=source_id, homepage=source.homepage,
                         name=source.name, email=user.email,
                         # for bg tasks table:
                         creator=user,
                         verbose_name=long_name)
    return return_task(task)

# called from management/commands/sources-meta-update.py
# (via MetadataUpdaterCommand.run_task)
@background(queue=SYSTEM_FAST)  # run via periodic script
def sources_metadata_update(**kws):
    metadata_update.sources_metadata_update(**kws)


# MUST run in same queue as sources-meta-update!!
@background(queue=SYSTEM_FAST)  # run via periodic script
def tweak_stories_per_week(**kws):
    misc_tasks.tweak_stories_per_week(**kws)
