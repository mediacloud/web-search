"""
(dummy) functions for statsd/grafana stats so we can look at requests
and system response in the same tool
"""
import logging
import time
from functools import wraps
from typing import TypeAlias

# PyPI
#import statsd

#from settings import STATSD_PREFIX
STATSD_PREFIX = "mc.REALM.web-search"

logger = logging.getLogger(__name__)

Label: TypeAlias = tuple[str, str | int]

def _fix(name: str) -> str:
    # underscores only used to separate label and value
    return name.replace("_", "-").strip("-")

def _make_name(aspect: str, app: str, group: str, *, labels: list[Label] = []) -> str:
    parts = [STATSD_PREFIX, aspect, _fix(app), _fix(group)]
    for key, val in labels:
        parts.append(f"{_fix(key)}_{val}")
    return ".".join(parts)

def count(aspect: str, app: str, group: str, *, labels: list[Label] = []) -> None:
    logger.debug("count %s", _make_name(aspect, app, group, labels=labels))

def timing(aspect: str, app: str, group: str, ms: float, *, labels: list[Label] = []) -> None:
    logger.debug("timing %s %.3f", _make_name(aspect, app, group, labels=labels), ms)

def path_stats(path: str, elapsed: float, status: int) -> None:
    """
    called from logging_middleware
    """
    if path.startswith("/api/"):
        elements = path[5:].split("/")
        if len(elements) < 2:
            logger.info("path_stats %s", path)
            return
        app = elements[0]
        ep = elements[1]            # endpoint
    elif path == "/":
        app = "front"
        ep = "home"
    else:
        return

    count("api", app, "calls", labels=[("ep", ep), ("status", status)])
    if status == 200:
        timing("api", app, "success", elapsed*1000, labels=[("ep", ep)])

