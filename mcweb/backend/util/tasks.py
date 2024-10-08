"""
Utilities for background tasks
"""

# Python
import datetime as dt
import logging

# PyPI
import background_task
from background_task.models import Task, CompletedTask

logger = logging.getLogger(__name__)

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

def background(queue: str, **kws):
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
    return background_task.background(queue=queue, **kws)


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
