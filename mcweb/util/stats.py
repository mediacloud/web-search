"""
(dummy) functions for statsd/grafana stats so we can look at requests
and system response in the same tool
"""
import logging
import time
from functools import wraps
from typing import TypeAlias

# PyPI
import statsd

from settings import STATSD_HOST, STATSD_PREFIX
logger = logging.getLogger(__name__)

Label: TypeAlias = tuple[str, str | int]

if STATSD_HOST and STATSD_PREFIX:
    statsd_client = statsd.StatsdClient(STATSD_HOST, None, STATSD_PREFIX)
else:
    statsd_client = None

def _fix(name: str) -> str:
    # use underscores only to separate label and value
    return name.replace("_", "-").strip("-")

def _make_name(elts: list[str], labels: list[Label] = []) -> str:
    """
    make a statsd metric string given path elements and labels
    (if ever converted to another metric schema, this hopefully
    localizes knowledge of how to structure data)
    """
    ret = []
    for elt in elts:
        ret.append(_fix(elt))
    for label, value in labels:
        ret.append(f"{_fix(label)}_{value}")
    return ".".join(ret)

def count(path: list[str], labels: list[Label] = []) -> None:
    name = _make_name(path, labels)
    logger.debug("count %s", name)
    if statsd_client:
        statsd_client.incr(name)

def timing(path: list[str], ms: float, labels: list[Label] = []) -> None:
    name = _make_name(path, labels)
    logger.debug("timing %s %.3f", name, ms)
    if statsd_client:
        statsd_client.timing(name, ms)

def gauge(path: list[str], value: float, labels: list[Label] = []) -> None:
    name = _make_name(path, labels)
    logger.debug("gauge %s %.3f", name, value)
    if statsd_client:
        statsd_client.gauge(name, value)

def path_stats(path: str, elapsed: float, status: int) -> None:
    """
    called from api_stats decorator.
    was once called from middleware, which meant many extraneous paths
    (admin, home, static content)
    """
    # handle double and trailing slashes, numeric arguments
    elements = [elt for elt in path.split("/")
                if elt and not elt.isdigit()]

    if len(elements) < 3 or elements[0] != "api":
        logger.warning("path_stats %s", path)
        return

    # 2026-10-30: only report app and top level viewset/op
    # (too many variations in sources, and variable length a pain)
    app = elements[1]
    what = elements[2]          # ViewSet or search type

    count(["api", "calls"], labels=[("app", app), ("what", what)])

    # 2026-10-30 report status by app
    count(["api", "status"], labels=[("app", app), ("status", status)])

    # timers are expensive (MANY disk files per name),
    # so only report by app, for successes for now
    if status == 200:
        timing(["api", "success"], elapsed*1000, labels=[("app", app)])

def api_stats(api_func):
    """
    decorator for *ALL* API calls for stats reporting.

    Can be used to decorate a rest_api handler (request first arg)
    or a class (ViewSet) method (request second arg)

    originally called from logging_middleware
    but it saw EVERY random path requested!!!
    """
    @wraps(api_func)
    def decorator(*args, **kwargs):
        t0 = time.monotonic()
        response = api_func(*args, **kwargs)
        elapsed = time.monotonic() - t0
        # crockery to work for ViewSet methods (first arg is ViewSet)
        if ((path := getattr(args[0], "path", None)) or
            (path := getattr(args[1], "path", None))):
            logger.debug("api_stats decorator %s %.6f %d",
                         path, elapsed, response.status_code)
            path_stats(path, elapsed, response.status_code)
        return response
    return decorator
