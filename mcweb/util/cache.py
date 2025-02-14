"""
provide wrappers around Django's caching
super useful (we keep results of api)

adapted from https://james.lin.net.nz/2011/09/08/python-decorator-caching-your-functions/
"""

# Python
import hashlib
import logging
from typing import Callable, Any

# PyPI
from django.core.cache import cache

# mcweb
from settings import CACHE_SECONDS

# mcweb.util (local dir)
import util.stats as stats

logger = logging.getLogger(__name__)

TRACE_CACHE = False

def trace(format, *args):
    if TRACE_CACHE:
        logger.debug(format, *args)

def count_total(which: str) -> None:
    stats.count(["cache", "total"], labels=[("status", which)])

def cached_function_call(fn: Callable, cache_prefix: str, seconds: int | None = None, *args, **kwargs) -> tuple[Any, bool]:
    """
    mother of all caching functions
    """
    # inlined to avoid expanding args/kwargs again.
    # tweaked key generation to delimit concatenated strings with non-printing
    # characters unlikely to appear in argument strings to avoid ambiguity
    # (everything was one continuous string)
    elements = [cache_prefix]
    for arg in args:
        elements.append(str(arg))
    for key, val in kwargs.items():
        # turn set kwargs (domains/url_search_strings) into sorted lists
        if isinstance(val, set):
            val = sorted(val)
        elif isinstance(val, dict):
            # url_search_strings is (default)dict of sets
            nval = {}
            for k2, v2 in sorted(val.items()):
                if isinstance(v2, set):
                    nval[k2] = sorted(v2)
                else:
                    nval[k2] = v2
            val = nval
        elements.append(f"{key}\x02{val}")
    readable_key = "\x01".join(elements)
    key = hashlib.md5(readable_key.encode("UTF8")).hexdigest()

    results = cache.get(key)
    if results:
        trace("found %r", readable_key)
        count_total("hit")
        return results, True

    trace("not found %r", readable_key)
    count_total("miss")
    results = fn(*args, **kwargs)
    if seconds is None:
        # this is the one place where the default value is used.
        # NOTE! used here to allow wacking CACHE_SECONDS in debugger!
        seconds = CACHE_SECONDS
    cache.set(key, results, seconds)
    trace("set %r", readable_key)
    return results, False

def mc_providers_cacher(fn: Callable, cache_prefix: str, *args, **kwargs) -> tuple[Any, bool]:
    """
    callable passed to mc_providers caching interface.
    this is the one place that needs to return the was_cached bool
    (changing the cacheing function API would require an mc_providers major version change)
    always gets default cache time (could have a separate setting)
    """
    return cached_function_call(fn, cache_prefix, None, *args, **kwargs)

# decorator for caching functions/methods in backend code
def cache_by_kwargs(seconds: int | None = None):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            value, cached = cached_function_call(fn, fn.__qualname__, seconds, *args, **kwargs)
            return value
        return wrapper

    return decorator
