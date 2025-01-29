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
    # handle double and trailing slashes, numeric arguments
    elements = [elt for elt in path.split("/")
                if elt and not elt.isdigit()]

    if not elements:
        app = "home"
        elements = ["home"]     # want timing
    elif elements[0] == "api":
        elements.pop(0)
        if not elements:
            logger.info("path_stats %s", path)
            return
        app = elements[0]
    elif elements[0].startswith("admin"):
        elements = ["admin"]    # too many variations
    else:
        # not home page, not api, not admin
        logger.info("path_stats2 %s", path)
        return

    # counters are cheap (two files per name)
    if elements:
        count(["api", "calls"] + elements, labels=[("status", status)])

    # timers are expensive (MANY disk files per name),
    # so only report by app, for successes for now
    if status == 200:
        app = elements[0]
        timing(["api", "success"], elapsed*1000, labels=[("app", app)])
