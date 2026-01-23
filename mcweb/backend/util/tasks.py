"""
Utilities for background tasks for all apps
"""

# Python
import datetime as dt
import json
import logging
import os
import time
import types                    # for TracebackType

# PyPI
import background_task          # for background
from background_task.models import Task, CompletedTask
from background_task.tasks import TaskProxy

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from settings import SYSTEM_TASK_USERNAME, SENTRY_ENV
from backend.util.syslog_config import LOG_DIR

# local directory:
from .provider import get_provider

logger = logging.getLogger(__name__)

TASKS_LOG_DIR = os.path.join(LOG_DIR, "tasks")


################ queue names
# NOTE! To enable/add a new queue you must also add a new line to Procfile!!

# periodic system tasks, not launched on demand
SYSTEM_FAST = 'system-fast'  # eg stories/week update
SYSTEM_SLOW = 'system-slow'  # eg sources alerts

# admin/collections tasks, launched on demand
ADMIN_FAST = 'admin-fast'  # eg scrape source
ADMIN_SLOW = 'admin-slow'  # eg scrape collection

# ordinary user tasks, launched on demand
USER_FAST = 'user-fast'
USER_SLOW = 'user-slow'  # eg email query results

# See comment at top about adding new queues!!

def background(*, queue: str, **kws):
    """
    @background decorator for background task functions.

    (wrapper for background_task.background
    with required queue name argument!)

    see https://django-background-tasks.readthedocs.io/en/latest/
    optional arguments:
          schedule=TIME (seconds delay, timedelta, django.utils.timezone.now())
          name=None (defaults to "module.function")
          remove_existing_tasks=False
                  if True, all unlocked tasks with the identical task hash
                  (based on task name and args ONLY) will be removed.
   
    calling decorated function schedules a background task, can be passed:
          verbose_name="description"
          creator=user (any model object?)
          repeat=SECONDS, repeat_until=Optional[dt.datetime]
                  available constants for repeat: Task.NEVER, Task.HOURLY,
                  Task.DAILY, Task.WEEKLY, Task.EVERY_2_WEEKS, Task.EVERY_4_WEEKS

    decorated function return value is not saved!
    background_task.models.Task is returned to caller.
    calling decorated_function.now() invokes decorated function synchronously.

    NOTE!!! to avoid problems with previously queued tasks,
    decorated functions must not:
    * get additional required argument
    * be renamed
    """
    remove_existing = kws.pop("remove_existing_tasks", True)
    return background_task.background(queue=queue,
                                      remove_existing_tasks=remove_existing,
                                      **kws)


def _serialize_task(task):
    """
    helper to return JSON representation of a Task.
    """
    # probably should return a subset of fields?
    # (or provide a serializer?)
    return { key: (value.isoformat() if isinstance(value, dt.datetime) else value)
             for key, value in task.__dict__.items() if key[0] != '_' }


_serialize_completed_task = _serialize_task


def return_error(message):
    """
    helper to return JSON representation for an error
    NOT task specific, but used by task functions
    """
    logger.info(f"return_error {message}")
    return {'error': message}


def return_task(task):
    """
    formulate "task" return (analagous to return_error)
    returns dict with "task" key w/ serialized task (dict)
    """
    return {'task': _serialize_task(task)}


def get_completed_tasks(user: str | None) -> dict:
    """
    return ALL completed tasks.
    If user provided, return just tasks for that user.

    Currently available thru SourcesViewSet for historical reasons.
    """
    tasks = CompletedTask.objects
    if user:
        tasks = tasks.created_by(user)
    return {'completed_tasks': [_serialize_completed_task(task) for task in tasks]}


def get_pending_tasks(user: str | None) -> dict[str, list[dict]]:
    """
    return ALL pending tasks.
    If user provided, return just tasks for that user.

    Currently available thru SourcesViewSet for historical reasons.
    """
    tasks = Task.objects
    if user:
        tasks = tasks.created_by(user)
    return {'tasks': [_serialize_task(task) for task in tasks]}


def get_task_provider(provider_name: str, task_name: str, caching: int = 0):
    """
    get an mc_provider object in a uniform way
    """
    return get_provider(provider_name, session_id=f'{task_name}@{SENTRY_ENV}', caching=caching)

def path_safe(thing: str) -> str:
    """
    return pathname safe version of thing
    """
    return thing.replace(os.path.sep, "_").replace(" ", "_")

class TaskLogContext:
    """
    context for task logging
    Catch exceptions not otherwise handled.
    log everything to a named file
    """
    # control logging with a constance setting?
    LOG_FILE = True

    def __init__(self, *, task_args: dict, options: dict):
        self.username = options["user"]
        self.long_name = task_args["long_task_name"]
        self.handler: logging.Handler | None = None # log file
        self.t0 = 0.0

    def __enter__(self) -> "TaskLogContext":
        self.t0 = time.monotonic()
        if not os.path.exists(TASKS_LOG_DIR):
            os.makedirs(TASKS_LOG_DIR)

        date = time.strftime("%Y-%m-%d-%H%M%S", time.gmtime())
        username = path_safe(self.username or "noname")
        long_name = path_safe(self.long_name)

        self.fname = f"{date}.{username}.{long_name}.log"
        path = os.path.join(TASKS_LOG_DIR, self.fname)
        self.handler = logging.FileHandler(path)
        self.handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s"))
        self.handler.setLevel(logging.DEBUG)

        # add handler to root logger
        logging.getLogger('').addHandler(self.handler)
        logger.info("logging to %s", path)

        return self

    def __exit__(self, exc_type: type[BaseException],
                 value: BaseException,
                 traceback_: types.TracebackType) -> bool:
        sec = time.monotonic() - self.t0
        if exc_type:
            # should only get here with unhandled exceptions
            logger.exception("Exception for %s in %s (%.3f sec)",
                             self.username, self.long_name, sec)

        if value:
            logger.error("ending log %s, Exception: %r", self.fname, value)
        else:
            logger.info("ending log %s (%.3f sec)", self.fname, sec)

        if self.handler:
            logging.getLogger('').removeHandler(self.handler)
            self.handler.close()
            self.handler = None

        return True             # suppress exception!!!!

class TaskCommand(BaseCommand):
    """
    base class for manage commands that invoke (background) tasks
    """
    def long_task_name(self, options: dict) -> str:
        """
        must be overridden to return a task description
        for the Task table, and used in the task log file
        (just a few words)
        """
        raise NotImplementedError("long_task_name not implemented")

    def add_arguments(self, parser):
        parser.add_argument("--queue", action="store_true",
                            help="Queue the task to run in the background.")

        parser.add_argument("--user", default=SYSTEM_TASK_USERNAME,
                            help=f"User to run task under (default {SYSTEM_TASK_USERNAME}).")
        super().add_arguments(parser)

    def run_task(self, func: TaskProxy, options: dict, **kwargs):
        """
        utility for invoking task function from handle method.

        func is a background task function in tasks.py that has been decorated
        with @background()
        """
        long_name = self.long_task_name(options)

        # for passing things NOT in options dict

        username = options["user"]

        # will raise exception for bad/missing user:
        user = User.objects.get(username=username)

        # test if data JSONable for Task table
        json.dumps(kwargs)
        json.dumps(options)

        # assemble one arg keyword arg dict for both flavors of call
        args = {
            "options": options,
            "task_args": {
                "long_task_name": long_name # for TaskLogContext (log file name)
            },
            **kwargs
        }
        if options["queue"]:
            logger.info("queuing %s task for %s", long_name, username)
            func(**args,
                 # for background package Task table:
                 creator=user,
                 verbose_name=long_name)
        else:
            # run in-process now:
            logger.info("running %s task for %s", long_name, username)
            func.now(**args)
