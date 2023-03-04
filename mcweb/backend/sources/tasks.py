"""
Background tasks for "sources" app
(must be named tasks.py? next to app models.py??)
"""

# standard:
import datetime as dt
import logging

# PyPI:
from background_task import background
from background_task.models import Task, CompletedTask
from feed_seeker import generate_feed_urls
from mcmetadata.feeds import normalize_url

# from sources app:
from .models import Feed, Source

SCRAPE_TIMEOUT_SECONDS = 120

logger = logging.getLogger(__name__)

# see https://django-background-tasks.readthedocs.io/en/latest/

# @background decorator takes optional arguments:
#       queue='queue-name'
#       schedule=TIME (seconds delay, timedelta, django.utils.timezone.now())
#       name=None (defaults to "module.function")
#       remove_existing_tasks=False
#               if True, all unlocked tasks with the identical task hash
#               (based on task name and args ONLY) will be removed.
#
# calling decorated function schedules a background task, can be passed:
#       verbose_name="description"
#       creator=user (any model object?)
#       repeat=SECONDS, repeat_until=Optional[dt.datetime]
#               available constants for repeat: Task.NEVER, Task.HOURLY,
#               Task.DAILY, Task.WEEKLY, Task.EVERY_2_WEEKS, Task.EVERY_4_WEEKS
# decorated function return value is not saved!
# and returns a background_task.models.Task object.
#
# calling decorated_function.now() invokes decorated function synchronously.

@background()
def _scrape_source(source_id, homepage):
    logger.info(f"==== starting _scrape_source(source_id, homepage)")

    # work around not having a column/index for normalized feed url:
    # create set of normalized urls of current feeds
    old_urls = set([normalize_url(feed.url)
                    for feed in Feed.objects.filter(source_id=source_id)])

    # background_tasks does not implement job timeouts, so use
    # feed_seeker's; returns a generator, so gobble up returns so that
    # DB operations are not under the timeout gun.
    new_urls = list(generate_feed_urls(homepage, max_time=SCRAPE_TIMEOUT_SECONDS))

    for url in new_urls:
        if normalize_url(url) not in old_urls:
            logger.info(f"scrape_source({source_id}, {homepage}) found new feed {url}")
            feed = Feed(source_id=source_id, admin_rss_enabled=True, url=url)
            feed.save()
        else:
            logger.info(f"scrape_source({source_id}, {homepage}) found old feed {url}")

    # send email????
    logger.info(f"==== finished _scrape_source(source_id, homepage)")

def _return_task(task):
    """
    helper to return JSON representation of a Task.
    """
    # probably should return a subset!
    # (or provide a serializer?)
    return { key: (value.isoformat() if isinstance(value, dt.datetime) else value)
             for key, value in task.__dict__.items() if key[0] != '_' }

_return_completed_task = _return_task

def _return_error(message):
    """
    helper to return JSON representation for an error
    """
    logger.info(f"_return_error {message}")
    return {'error': message}


def schedule_scrape_source(source_id, user):
    """
    call this function from a view action to schedule a (re)scrape
    """
    source = Source.objects.get(id=source_id)
    if not source:
        return _return_error(f"source {source_id} not found")

    # check source.homepage not empty??
    if not source.homepage:
        return _return_error(f"source {source_id} missing homepage")

    # maybe check if re-scraped recently????


    # NOTE! Will remove any other pending scrapes for same source
    # rather than queuing a duplicate. Returns a Task object,
    # the new user will "steal" the task
    name_or_home = source.name or source.homepage
    task = _scrape_source(source_id, source.homepage, creator=user,
                          verbose_name=f"rescrape {name_or_home}",
                          remove_existing_tasks=True)
    return {'task': _return_task(task)}


def get_completed_tasks(user):
    """
    return ALL completed tasks.
    If user set, return just tasks for that user.
    """
    tasks = CompletedTask.objects
    if user:
        tasks = tasks.created_by(user)
    return {'completed_tasks': [_return_completed_task(task) for task in tasks]}


def get_pending_tasks(user):
    """
    return ALL pending tasks.
    If user set, return just tasks for that user.
    """
    tasks = Task.objects
    if user:
        tasks = tasks.created_by(user)
    return {'tasks': [_return_task(task) for task in tasks]}
