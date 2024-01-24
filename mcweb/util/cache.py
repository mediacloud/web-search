from django.core.cache import cache

# not integrated yet: super useful (we keep results of api) (lasts for 24 hours)

# provide helpers for working with Django's caching
# adapted from https://james.lin.net.nz/2011/09/08/python-decorator-caching-your-functions/


# get the cache key for storage
def _cache_get_key(*args, **kwargs):
    import hashlib
    serialise = []
    for arg in args:
        serialise.append(str(arg))
    for key, arg in kwargs.items():
        serialise.append(str(key))
        serialise.append(str(arg))
    key = hashlib.md5("".join(serialise).encode("UTF8")).hexdigest()
    return key


# decorator for caching functions (default to one day)
def cache_by_kwargs(time_secs: int = 60*60*24):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            key = _cache_get_key(fn.__name__, *args, **kwargs)
            result = cache.get(key)
            if not result:
                result = fn(*args, **kwargs)
                cache.set(key, result, time_secs)
            return result

        return wrapper

    return decorator

#Function to pass to the caching interface 
class django_caching_interface():
    def __init__(self, time_secs: int = 60*60*24):
        self.time_secs = time_secs
        
    def __call__(self, fn, *args, **kwargs):
        key = _cache_get_key(fn.__name__, *args, **kwargs)
        results = cache.get(key)
        if not results:
            results = fn(*args, **kwargs)
            cache.set(key, results, self.time_secs)
        return results
    