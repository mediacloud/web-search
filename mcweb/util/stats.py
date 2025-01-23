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

from settings import STATSD_HOST, STATSD_REALM
logger = logging.getLogger(__name__)

Label: TypeAlias = tuple[str, str | int]

if STATSD_HOST and STATSD_REALM:
    # NOTE: same order used by rss-fetcher & story-indexer
    prefix = f"mc.{STATSD_REALM}.web-search"
    statsd_client = statsd.StatsdClient(STATSD_HOST, None, prefix)
else:
    statsd_client = None

def _fix(name: str) -> str:
    # use underscores only to separate label and value
    return name.replace("_", "-").strip("-")

def _make_name(elts: list[str], labels: list[Label] = []) -> str:
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

def path_stats(path: str, elapsed: float, status: int) -> None:
    """
    called from logging_middleware
    """
    if path.startswith("/api/"):
        # handle double and trailing slashes
        elements = [elt for elt in path[5:].split("/") if elt and not elt.isdigit()]
        if len(elements) < 2:
            logger.info("path_stats %s", path)
            return
    elif path == "/":
        elements = ["home"]
    else:
        return

    # counters are cheap (two files per name)
    count(["api", "calls"] + elements, labels=[("status", status)])

    # timers are expensive (MANY disk files per name),
    # so only report by app, for succcesses for now
    if status == 200:
        app = elements[0]
        timing(["api", "success"], elapsed*1000, labels=[("app", app)])
