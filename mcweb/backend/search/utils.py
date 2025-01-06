# Python
import datetime as dt
import json
import time
from collections import defaultdict
from typing import Any, Callable, Dict, Generator, Iterable, List, NamedTuple, Optional, Tuple

# PyPI
from django.apps import apps
from mc_providers import provider_by_name, provider_name, ContentProvider, \
    PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER, PLATFORM_YOUTUBE,\
    PLATFORM_SOURCE_YOUTUBE, PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT, PLATFORM_SOURCE_MEDIA_CLOUD,\
    PLATFORM_SOURCE_WAYBACK_MACHINE, PLATFORM_ONLINE_NEWS

# mcweb
from settings import ALL_URLS_CSV_EMAIL_MAX, ALL_URLS_CSV_EMAIL_MIN, NEWS_SEARCH_API_URL

# mcweb/backend/users
from ..users.models import QuotaHistory

class ParsedQuery(NamedTuple):
    start_date: dt.datetime
    end_date: dt.datetime
    query_str: str
    provider_props: dict
    provider_name: str
    api_key: str | None
    base_url: str | None
    caching: bool = True
    session_id: str | None = None

# not used?
def fill_in_dates(start_date, end_date, existing_counts):
    delta = (end_date + dt.timedelta(1)) - start_date
    date_count_dict = {k['date']: k['count'] for k in existing_counts}

    # whether or not the dates in existing_counts are string types
    dates_as_strings = (len(date_count_dict.keys()) == 0) or (isinstance(next(iter(date_count_dict.keys())), str))
    if not dates_as_strings:
        date_count_dict = {dt.datetime.strftime(k, "%Y-%m-%d %H:%M:%S"): v for k, v in date_count_dict.items()}

    filled_counts = []
    for i in range(delta.days):
        day = start_date + dt.timedelta(days=i)
        day_string = dt.datetime.strftime(day, "%Y-%m-%d %H:%M:%S")
        if day_string not in date_count_dict.keys():
            filled_counts.append({"count": 0, "date": day_string})
        else:
            filled_counts.append({'count': date_count_dict[day_string], 'date': day_string})
    return filled_counts

def pq_provider(pq: ParsedQuery, platform: Optional[str] = None) -> ContentProvider:
    """
    take parsed query, return mc_providers ContentProvider.
    (one place to pass new things to mc_providers)
    """
    return provider_by_name(platform or pq.provider_name,
                            api_key=pq.api_key, base_url=pq.base_url, caching=pq.caching,
                            client_id="web-search", session_id=pq.session_id)

def parse_date_str(date_str: str) -> dt.datetime:
    """
    accept both YYYY-MM-DD and MM/DD/YYYY
    (was accepting former in JSON and latter in GET/query-str)
    """
    if '-' in date_str:
        return dt.datetime.strptime(date_str, '%Y-%m-%d')
    else:
        return dt.datetime.strptime(date_str, '%m/%d/%Y')


def listify(input: str) -> list[str]:
    if input:
        return input.split(',')
    return []

_BASE_URL = {
    'onlinenews-mediacloud': NEWS_SEARCH_API_URL,
}

def _get_session_id(request) -> str | None:
    if request.user.is_authenticated:
        user = str(request.user)
        # XXX include a session hash from request.session?
        return user
    else:
        return None

def parse_query_params(request) -> (ParsedQuery, dict):
    """
    return ParsedQuery plus dict for other params
    """
    if request.method == 'POST':
        payload = json.loads(request.body)
        return (parsed_query_from_dict(payload.get("queryObject"), request), payload)

    provider_name = request.GET.get("p", 'onlinenews-mediacloud')
    query_str = request.GET.get("q", "*")
    collections = listify(request.GET.get("cs", None))
    sources = listify(request.GET.get("ss", None))
    provider_props = search_props_for_provider(
        provider_name,
        collections,
        sources,
        request.GET
    )
    start_date = parse_date_str(request.GET.get("start", "2010-01-01"))
    end_date = parse_date_str(request.GET.get("end", "2030-01-01"))
    api_key = _get_api_key(provider_name)
    base_url = _BASE_URL.get(provider_name)

    # caching is enabled unless cache is passed ONCE with:
    # "f" or "0" (disable local cache)
    # negative number (disable local and remote caches)
    cache_str = request.GET.get("cache", "1")
    if cache_str == "t":
        caching = 1
    elif cache_str == "f":
        caching = 0
    else:
        try:
            caching = int(cache_str)
        except ValueError:
            caching = 1

    pq = ParsedQuery(start_date=start_date, end_date=end_date,
                     query_str=query_str, provider_props=provider_props,
                     provider_name=provider_name, api_key=api_key,
                     base_url=base_url, caching=caching,
                     session_id=_get_session_id(request))
    return (pq, request.GET)

def parse_query(request) -> ParsedQuery:
    pq, payload = parse_query_params(request)
    return pq

def parsed_query_from_dict(payload, request) -> ParsedQuery:
    """
    Takes a queryObject dict, returns ParsedQuery
    """
    provider_name = payload["platform"]
    query_str = payload["query"]
    collections = payload["collections"]
    sources = payload["sources"]
    provider_props = search_props_for_provider(provider_name, collections, sources, payload)
    start_date = parse_date_str(payload["startDate"])
    end_date = parse_date_str(payload["endDate"])
    api_key = _get_api_key(provider_name)
    base_url = _BASE_URL.get(provider_name)
    caching = payload.get("caching", True)
    return ParsedQuery(start_date=start_date, end_date=end_date,
                       query_str=query_str, provider_props=provider_props,
                       provider_name=provider_name, api_key=api_key,
                       base_url=base_url, caching=caching,
                       session_id=_get_session_id(request))

def parsed_query_state(request) -> list[ParsedQuery]:
    """
    return list of parsed queries from "queryState" (list of dicts).
    Expects POST with JSON object with a "queryState" element (download-all-queries)
    or GET with qs=JSON_STRING (many)
    """
    if request.method == 'POST':
        payload = json.loads(request.body)
        queries = payload.get("queryState")
    else:
        queries = json.loads(request.GET.get("qS"))

    pqs = [parsed_query_from_dict(q, request) for q in queries]
    return pqs

def _get_api_key(provider: str) -> str | None:
    # no system-level API keys right now
    return None

def search_props_for_provider(provider, collections: List, sources: List, all_params: Dict) -> Dict:
    if provider == provider_name(PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER):
        return _for_twitter_api(collections, sources)
    if provider == provider_name(PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE):
        return _for_youtube_api(collections, sources)
    if provider == provider_name(PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT):
        return _for_reddit_pushshift(collections, sources)
    if provider == provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_WAYBACK_MACHINE):
        return _for_wayback_machine(collections, sources)
    if provider == provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD):
        return _for_media_cloud(collections, sources, all_params)
    return {}


def _for_youtube_api(collections: List, sources: List) -> Dict:
    # TODO: filter by a list of channels
    return dict()


def _for_twitter_api(collections: List, sources: List) -> Dict:
    # pull these in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')
    usernames = []
    # turn media ids into list of usernames
    selected_sources = Source.objects.filter(id__in=sources)
    usernames += [s.name for s in selected_sources]
    # turn collections ids into list of usernames
    selected_sources = Source.objects.filter(collections__id__in=collections)
    usernames += [s.name for s in selected_sources]
    return dict(usernames=usernames)


def _for_reddit_pushshift(collections: List, sources: List) -> Dict:
    # pull these in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')
    subreddits = []
    # turn media ids into list of subreddits
    selected_sources = Source.objects.filter(id__in=sources)
    subreddits += [s.name for s in selected_sources]
    # turn collections ids into list of subreddits
    selected_sources = Source.objects.filter(collections__id__in=collections)
    subreddits += [s.name for s in selected_sources]
    # clean up names
    subreddits = [s.replace('/r/', '') for s in subreddits]
    return dict(subreddits=subreddits)


def _for_wayback_machine(collections: List, sources: List) -> Dict:
    # pull these in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')
    # 1. pull out all unique domains that don't have url_search_strs
    domains = []
    # turn media ids into list of domains
    selected_sources = Source.objects.filter(id__in=sources)
    domains += [s.name for s in selected_sources if s.url_search_string is None]
    # turn collections ids into list of domains
    selected_sources_in_collections = Source.objects.filter(collections__id__in=collections)
    selected_sources_in_collections = [s for s in selected_sources_in_collections if s.name is not None]
    domains += [s.name for s in selected_sources_in_collections if bool(s.url_search_string) is False]
    # 2. pull out all the domains that have url_search_strings and turn those into search clauses
    # CURRENTLY URL_SEARCH_STRINGS ARE NOT IMPLEMENTED IN WB SYSTEM
    # sources_with_url_search_strs = []
    # sources_with_url_search_strs += [s for s in selected_sources if bool(s.url_search_string) is not False]
    # sources_with_url_search_strs += [s for s in selected_sources_in_collections if bool(s.url_search_string) is not False]
    # domain_url_filters = ["(domain:{} AND url:*{}*)".format(s.name, s.url_search_string) for s in sources_with_url_search_strs]
    return dict(domains=domains)

def _for_media_cloud_OLD(collections: List, sources: List, all_params: Dict) -> Dict:
    # pull these in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')
    # 1. pull out all unique domains that don't have url_search_strs
    domains = []
    # turn media ids into list of domains
    selected_sources = Source.objects.filter(id__in=sources)
    domains += [s.name for s in selected_sources if not s.url_search_string]
    # turn collections ids into list of domains
    selected_sources_in_collections = Source.objects.filter(collections__id__in=collections)
    selected_sources_in_collections = [s for s in selected_sources_in_collections if s.name is not None]
    domains += [s.name for s in selected_sources_in_collections if bool(s.url_search_string) is False]
    # 2. pull out all the domains that have url_search_strings and turn those into search clauses
    #    note: ignore sources whose domain is in the list of domains that don't have a url_search_string (e.g. if
    #    parent bizjournals.com is in domain list then ignore town-specific bizjournals.com to reduce query length)
    sources_with_url_search_strs = []
    sources_with_url_search_strs += [s for s in selected_sources if bool(s.url_search_string) is not False
                                     and s.name not in domains]
    sources_with_url_search_strs += [s for s in selected_sources_in_collections if bool(s.url_search_string) is not False
                                     and s.name not in domains]
   
    domain_url_filters = [f"(canonical_domain:{s.name} AND (url:http\://{s.url_search_string} OR url:https\://{s.url_search_string}))"
                          for s in sources_with_url_search_strs]
    # 3. assemble and add in other supported params
    supported_extra_props = ['pagination_token', 'page_size', 'sort_field', 'sort_order',
                             'expanded']  # make sure nothing nefarious gets through
    extra_props = dict(domains=domains, filters=domain_url_filters, chunk=True) 
    for prop_name in supported_extra_props:
        if prop_name in all_params:
            extra_props[prop_name] = all_params.get(prop_name)
    return extra_props

def _for_media_cloud(collections: list[int], sources: list[int], all_params: dict) -> dict:
    # pull in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')

    # 1. collect unique sources with and without url_search_string (uss)
    domains: set[str] = set()   # unique domains w/o url_search_string

    # unique srcid to domain and url_search_string
    domain_and_uss_by_sid: dict[int, tuple[str, str]] = {}

    def save_source(srcs):
        for src in srcs:
            if src.url_search_string:
                domain_and_uss_by_sid[src.id] = (src.name, src.url_search_string)
            elif src.name:
                domains.add(src.name)
            # else log "source without name"!??

    save_sources(Source.objects.filter(id__in=sources))
    save_sources(Source.objects.filter(collections__id__in=collections))

    # 2. second pass: create dict indexed by domain
    #    with sets of url_search_strings for domains
    #    that are not in the "domains" set
    url_search_strings = defaultdict(set)
    for domain, uss in domain_and_uss_by_sid.values():
        if domain not in domains:
            # add to the set of search strings for the domain
            url_search_strings[domain].add(uss)

    # 3. assemble dict of search properties
    props = {
        "domains": domains,
        "url_search_strings": url_search_strings
    }

    # 4. add in other supported params
    supported_extra_props = ['expanded',
                             'page_size', 'pagination_token',
                             'sort_field', 'sort_order']
    for prop_name in supported_extra_props:
        if prop_name in all_params:
            props[prop_name] = all_params[prop_name]

    return props

def filename_timestamp() -> str:
    """
    used for CSV & ZIP filenames in both views.py and tasks.py
    """
    return time.strftime("%Y%m%d%H%M%S", time.localtime())

def all_content_csv_generator(pqs: list[ParsedQuery], user_id, is_staff) -> Callable[[],Generator[list, None, None]]:
    """
    returns function returning generator for "total attention" CSV file
    with rows from all queries.
    used for both immediate CSV download (download_all_content_csv)
    and emailed CSV (download_all_large_content_csv)
    """
    def data_generator() -> Generator[list, None, None]:
        # phil: moved outside per-query loop (so headers appear once)
        first_page = True
        for pq in pqs:
            provider = pq_provider(pq)
            result = provider.all_items(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
            for page in result:
                QuotaHistory.increment(user_id, is_staff, pq.provider_name)
                if first_page:  # send back column names, which differ by platform
                    yield sorted(page[0].keys())
                    first_page = False
                for story in page:
                    yield [v for k, v in sorted(story.items())]
    return data_generator

def all_content_csv_basename(pqs: list[ParsedQuery]) -> str:
    """
    returns a base filename for CSV and ZIP filenames
    """
    base_filename = "mc-{}-{}-content".format(pqs[-1].provider_name, filename_timestamp())
    return base_filename
