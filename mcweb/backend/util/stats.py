"""
(dummy) functions for statsd/grafana stats so we can look at requests
and system response in the same tool
"""
import logging
from typing import TypeAlias

# PyPI
#import statsd

#from settings import STATSD_PREFIX
STATSD_PREFIX = "mc.REALM.mcweb"

logger = logging.getLogger(__name__)

Label: TypeAlias = tuple[str, str | int]

def _fix(name: str) -> str:
    # underscores only used to separate label and value
    return name.replace("_", "-").strip("-")]

class Stats:
    def __init__(self, app: str):
        self.app = app

    def _make_name(name: str, labels: list[Label]):
        parts = [STATSD_PREFIX, self.app, _fix(name)]
        for label, value in labels:
            parts.append(f"{_fix(label)}_{value}")
        return ".".join(parts)

    def count(name: str, *, labels: list[Label] = []):
        """
        increment a counter
        """
        if not STATSD_PREFIX:   # XXX and server
            return
        name = _make_name(name, labels)
        logger.debug("increment %s", name)
        # XXX actual increment call here

    def timing(name: str, sec: float, *, labels: list[Label] = []):
        """
        report a timing in seconds
        """
        if not STATSD_PREFIX:   # XXX and server
            return
        name = _make_name(name, labels)
        ms = sec * 1000
        logger.debug("timing %s %.3f", name, ms)
        # XXX actual timing call here
