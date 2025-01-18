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

# XXX add a method for decorating web endpoints!!!
class Stats:
    def __init__(self, app: str):
        self.app = app

    def _make_name(self, group: str, item: str, labels: list[Label]):
        parts = [STATSD_PREFIX, self.app, _fix(group), _fix(item)]
        for label, value in labels:
            parts.append(f"{_fix(label)}_{value}")
        return ".".join(parts)

    def count(self, group: str, item: str, *, labels: list[Label] = []):
        """
        increment a counter
        """
        if not STATSD_PREFIX:   # XXX and server
            return
        name = self._make_name(group, item, labels)
        logger.debug("increment %s", name)
        # XXX actual increment call here

    def timing(self, group: str, item: str, sec: float, *, labels: list[Label] = []):
        """
        report a timing in seconds
        """
        if not STATSD_PREFIX:   # XXX and server
            return
        name = self._make_name(group, item, labels)
        ms = sec * 1000
        logger.debug("timing %s %.3f", name, ms)
        # XXX actual timing call here

    def wrap(self, func):
        """
        decorator for timing/stats
        needs to be after any decorators
        that don't preserve __name__!

        Maybe this should be done in a middleware
        (and use request path to get endpoint name?)??

        could make wrapper take a group name e.g.
        `@stats.wrapper("group")` but that means another level of
        function nesting here, and for no immediate benefit.
        """
        # if this fires, a decorator after this one didn't preserve __name__
        assert func.__name__ not in ["view", "decorator", "_handler"]

        @wraps(func)
        def decorator(request):
            """
            NOTE! would like to count by (labeled) status code, but this
            decorator needs to be early to get intact __name__, 
            and decorators called after may transmute exceptions into
            error responses.
            """
            t0 = time.monotonic()
            ret = func(request)
            if ret.status_code == 200:
                self.timing("success", func.__name__, time.monotonic() - t0)
                self.count("success", func.__name__) # gives rate

            return ret
        return decorator
