"""
Background tasks for "sources" app

(almost) only decorated functions defined in other files
to keep files just a few pages long.
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
@background(queue=SYSTEM_SLOW)  # run via periodic script
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

    task = scrape_collection(username=user.username,
                             collection_id=collection_id, email=user.email,
                             # for bg tasks table:
                             creator=user,
                             verbose_name=f"rescrape collection {collection_id}")
    return return_task(task)


@background(queue=ADMIN_FAST)   # admin user initiated
def scrape_source(**kws):
    scrape.scrape_source(**kws)

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

    # NOTE! Will remove any other pending scrapes for same source
    # rather than queuing a duplicate; the new user will "steal" the task
    # (leaving no trace of the old one). Returns a Task object.
    task = scrape_source(username=user.username,
                         source_id=source_id, homepage=source.homepage,
                         name=source.name, email=user.email,
                         # for bg tasks table:
                         creator=user,
                         verbose_name=f"rescrape source {source_id}")
    return return_task(task)

# called from management/commands/sources-meta-update.py
# (via MetadataUpdaterCommand.run_task)
@background(queue=SYSTEM_SLOW)  # run via periodic script
def sources_metadata_update(**kws):
    metadata_update.sources_metadata_update(**kws)
