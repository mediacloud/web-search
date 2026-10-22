# Python
import datetime as dt
import json
import logging
import time
from collections import defaultdict
from enum import Enum
from typing import Any, Callable, Dict, Generator, Iterable, List, Mapping, NamedTuple, Optional

# PyPI
import constance
from django.apps import apps
from django.db.models import F

# no longer in PyPI:
from mc_providers import provider_by_name, provider_name, ContentProvider, PLATFORM_SOURCE_MEDIA_CLOUD,\
    PLATFORM_ONLINE_NEWS

# mcweb
from settings import ALL_URLS_CSV_EMAIL_MAX, ALL_URLS_CSV_EMAIL_MIN

# mcweb/backend/users
from ..users.models import QuotaHistory

# mcweb/backend/utils/provider
from ..util.provider import get_provider

from util.exceptions import UserValueError

logger = logging.getLogger(__name__)

class FileType(Enum):
    """
    types of generated CSV files for pq_basename()
    .value is used in filename
    """
    ALL_CONTENT = "content"     # all hits/URLs
    COUNTS = "counts"
    TOP_LANGUAGES = "top-languages"
    TOP_SOURCES = "top-sources"
    TOP_WORDS = "top-words"

class ParsedQuery(NamedTuple):
    """
    If at any point it becomes necessary to mangle the user query in
    some way (ie; wrap in parens) again before passing to
    mc-providers, either do it in the process of creating the
    ParsedQuery (two places, in this file), or replace the query
    member below with _query (and hit those two places) and define a
    query @property that does the mangling.
    """

    start_date: dt.datetime
    end_date: dt.datetime
    query: str
    provider_props: dict
    provider_name: str
    api_key: str | None
    caching: bool = True
    session_id: str | None = None

def pq_provider(pq: ParsedQuery, platform: Optional[str] = None) -> ContentProvider:
    """
    take parsed query, return mc_providers ContentProvider.
    """
    name = platform or pq.provider_name
    return get_provider(name, api_key=pq.api_key,
                        caching=pq.caching, session_id=pq.session_id)


def _get_parse_date(params: dict[str], key: str) -> dt.datetime:
    """
    accept both YYYY-MM-DD and MM/DD/YYYY
    (was accepting former in JSON and latter in GET/query-str)
    """
    date_str: str | None = params.get(key)
    if not date_str:
        raise UserValueError(f"Missing '{key}' parameter/value")
    try: 
        if '-' in date_str:
            return dt.datetime.strptime(date_str, '%Y-%m-%d')
        else:
            return dt.datetime.strptime(date_str, '%m/%d/%Y')
    except ValueError:
        raise UserValueError(f"Bad '{key}' value: must be date (without time)")


def _listify(input: str) -> list[str]:
    if input:
        return input.split(',')
    return []

def request_session_id(request) -> str | None:
    if request.user.is_authenticated:
        user = request.user.email
        # XXX include a session hash from request.session?
        return user
    else:
        return None

def parse_query_params(request, is_search: bool = True, **default_props) -> (ParsedQuery, dict):
    """
    return ParsedQuery plus dict for other params.

    NOTE! `is_search` added to avoid doing more major rework
    of views.story_detail.  If you find yourself needing to set `is_search=False`
    consider whether there should be a cleaner solution (possibly avoiding
    a ParsedQuery object, or an alternate function to make one)
    """
    session_id = request_session_id(request)
    if request.method == 'POST':
        payload = json.loads(request.body)
        return (parsed_query_from_dict(payload.get("queryObject"), session_id), payload)

    provider_name = request.GET.get("p", 'onlinenews-mediacloud')
    if is_search:
        query_str = request.GET.get("q")
        if not query_str: # NOTE: passing "*" is OK
            raise UserValueError("Missing 'q' parameter value")
        cs = request.GET.get("cs", None)
        ss = request.GET.get("ss", None)
        # allow staff without ado for SourceInspector:
        if cs is None and ss is None and not request.user.is_staff:
            raise UserValueError("Must have at least one of 'ss' or 'cs' parameters")
        # here we want to combine any defaults and any user-supplied props together and pass them
        # to the provider to figure out which are valid or invalid for that provider
        # QueryDict.dict() so values are strings (not lists); user-supplied values win over defaults
        other_props = default_props | request.GET.dict()
        provider_props = search_props_for_provider(
            provider_name,
            _listify(cs),
            _listify(ss),
            other_props
        )
        start_date = _get_parse_date(request.GET, "start")
        end_date = _get_parse_date(request.GET, "end")
    else:
        start_date = end_date = query_str = None
        provider_props = {}
    api_key = _get_api_key(provider_name)

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
                     query=query_str, provider_props=provider_props,
                     provider_name=provider_name, api_key=api_key,
                     caching=caching, session_id=session_id)
    return (pq, request.GET)

def parse_query(request, **defaults) -> ParsedQuery:
    """
    Central handler that parses all the search parameters out of the http request
    :param defaults useful for passing in any params required by the provider that the user might not have
                    set in an api call
    """
    pq, payload = parse_query_params(request, **defaults)
    return pq

def parsed_query_from_dict(payload: dict, session_id: str, **defaults) -> ParsedQuery:
    """
    Central handler that parses all the search parameters out of a dict that might have been POST'd as JSON
    Takes a queryObject dict, returns ParsedQuery
    """
    provider_name = payload["platform"]
    query_str = payload["query"]
    if not query_str:
        raise UserValueError("Missing 'query' parameter value")
    collections = payload["collections"]
    sources = payload["sources"]
    # ensure that any defaults and user properties are passed in to only return valid ones for
    # this provider
    all_props = defaults | payload
    provider_props = search_props_for_provider(provider_name, collections, sources, all_props)
    start_date = _get_parse_date(payload, "startDate")
    end_date = _get_parse_date(payload, "endDate")
    api_key = _get_api_key(provider_name)
    caching = payload.get("caching", True)
    return ParsedQuery(start_date=start_date, end_date=end_date,
                       query=query_str, provider_props=provider_props,
                       provider_name=provider_name, api_key=api_key,
                       caching=caching,
                       session_id=session_id)

def parsed_query_state(request, **defaults) -> list[ParsedQuery]:
    """
    return list of parsed queries from "queryState" (list of dicts).
    Expects POST with JSON object with a "queryState" element (download-all-queries)
    or GET with qs=JSON_STRING (many)
    :param defaults useful for passing in any params required by the provider that the user might not have
                    set in an api call
    """
    if request.method == 'POST':
        payload = json.loads(request.body)
        queries = payload.get("queryState")
    else:
        queries = json.loads(request.GET.get("qS"))

    session_id = request_session_id(request)
    pqs = [parsed_query_from_dict(q, session_id, **defaults) for q in queries]
    return pqs

def _get_api_key(provider: str) -> str | None:
    # no system-level API keys right now
    # (take "request" param to get user for BYO keys?)
    return None

def search_props_for_provider(provider, collections: List, sources: List, all_params: Dict) -> Dict:
    if provider == provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD):
        return _for_media_cloud(collections, sources, all_params)
    return {}


# additional query properties to pass to MediaCloud Providers
# sort_field could possibly be used nefariously (be used in a DoS
# attack, or to leak full text in pagination key), so omitting it
# until/unless it's needed and proven safe.
_MEDIA_CLOUD_EXTRA_PROPS = [
    'randomize',   # NOTE! view MUST check user has permission!
    'expanded',    # NOTE! view MUST check user has permission!
    'sort_order',  # NOTE: built into news-search-api?
    'pagination_token'
]

# add integer valued parameters here!
# that might have been converted to string in GET requests
_MEDIA_CLOUD_INT_PROPS = [
    'page_size',
    'limit'
]

def _copy_media_cloud_extra_props(output: Dict, input: Mapping) -> None:
    """
    copy selected API parameters to output (provider kwargs),
    filtering to make sure nothing nefarious gets through
    """
    for prop_name in _MEDIA_CLOUD_EXTRA_PROPS:
        if prop_name in input:
            output[prop_name] = input[prop_name]

    for prop_name in _MEDIA_CLOUD_INT_PROPS:
        if prop_name in input:
            output[prop_name] = int(input[prop_name])


def _validate_sources_or_collections(input: list[str],
                                     table, # django.models.Model
                                     platform: str) -> None:
    """
    helper to validatate sources or collections (handling is identical)
    """
    # set creation 2-3x slower than list, so make list of int at first
    # (the common case is all ids are valid):
    good_ids = list(table.objects
                    .filter(platform=platform, id__in=input)
                    .values_list('id', flat=True))

    num_good_ids = len(good_ids)
    if num_good_ids == len(input):
        return

    # initial check failed: see remove dups from input by making into set
    # (paranoia: input SHOULD be list[str], but make sure
    # str('str') should be noop; NEED two string sets below)
    input_set = set(map(str, input))
    if num_good_ids == len(input_set):
        return

    # set of strings (would need to convert int to str for formatting):
    bad_id_set = input_set - set(map(str, good_ids))
    missing = ",".join(bad_id_set)

    tname = table.__name__

    raise UserValueError(f"invalid {tname}(s): {missing}")


def _for_media_cloud(collections: list[str], sources: list[str], all_params: dict) -> dict:
    # pull in at runtime, rather than outside class, so we can make sure the models are loaded
    Source = apps.get_model('sources', 'Source')
    Collection = apps.get_model('sources', 'Collection')
    AlternativeDomain = apps.get_model('sources', 'AlternativeDomain')

    # 0. set up base queries

    # just ONLINE_NEWS sources
    news_srcs = Source.objects.filter(
        platform=Source.SourcePlatforms.ONLINE_NEWS)

    # Aliased fields end up last in results, and AlternativeDomain
    # table "domain" field has to be aliased to "name", so have to
    # alias url_search_string to "uss" in queries of both table to
    # ensure that all the queries return the name and uss columns in
    # the same order for UNIONization.  Define the column names once:
    union_cols = ['name', 'uss']

    srcs_by_id = (news_srcs.filter(id__in=sources)
                  .annotate(uss=F('url_search_string'))
                  .values(*union_cols))

    coll_srcs = news_srcs.filter(collections__id__in=collections)
    srcs_by_coll_id = coll_srcs.annotate(uss=F('url_search_string'))\
                               .values(*union_cols)

    # alternate domain table base query: need to alias the "domain"
    # column to "name" to match Source table for UNIONification, this
    # causes it to appear last in results, so url_search_string is
    # ALSO aliased to force IT to be last!!
    alts = AlternativeDomain.objects.annotate(name=F('domain'),
                                              uss=F('url_search_string'))\
                                    .values(*union_cols)

    # 1: Validate inputs (if enabled)
    if sources:
        _validate_sources_or_collections(sources, Source,
                                             Source.SourcePlatforms.ONLINE_NEWS)

    if collections:
        _validate_sources_or_collections(collections, Collection,
                                             Collection.CollectionPlatforms.ONLINE_NEWS)

    # 2: UNION the four queries: src by src/coll id, alts by src/coll id

    # Using UNION means we pass one query and get all the results at once:
    # * avoiding multiple database round trips (the "1+N problem")
    # * queries can be run in parallel if the SQL optimizer chooses
    # * using OR in WHERE clause can stop use of indicices
    # * filters duplicate results

    union_queryset = srcs_by_id.union(
        srcs_by_coll_id,
        # AlternativeDomains by source ids:
        alts.filter(source_id__in=sources),
        # AlternativeDomains by collection ids:
        alts.filter(source_id__in=coll_srcs)
    )

    # 3: run the UNION query, collect parent domains, save child sources.

    # unique parent domains without url_search_string, domain set is
    # checked for each child source, so using set avoids
    # O(parents*children) searching.
    domains: set[str] = set()

    # rows with search strings:
    child_sources: list[dict] = []

    # NOTE! This is the ONLY place the queryset is iterated over, if
    # you must reiterate (reruns the query), consider running once,
    # collecting the results: rows = list(union_queryset)
    for row in union_queryset:
        if row["uss"]:
            child_sources.append(row)
        else:
            domains.add(row["name"]) # must ONLY contain parents!!

    # 4: collect sets of url_search_strings by domain skipping any where the parent is
    # present, so domains must ONLY contain parents. This can only be done after domain
    # set is complete).  UNION query should only return unique rows, but use set/add
    # instead of list/append out of excess caution.
    url_search_strings = defaultdict(set)
    for row in child_sources:
        domain = row["name"]
        if domain in domains:   # already searching parent?
            continue            # skip it.
        url_search_strings[domain].add(row["uss"])

    # 5. assemble dict of provider parameters:
    props = {}
    if domains:
        # repr used to generate cache key;
        # consider conversion to list if ordering proves to be an issue
        props["domains"] = domains

    if url_search_strings:
        # repr used to generate cache key
        # defaultdict repr is uglier than plain dict:
        # "defaultdict(<class 'set'>, {....})"
        # but is ordered, and hashed before use
        props["url_search_strings"] = url_search_strings

    # 6. add in other supported params
    _copy_media_cloud_extra_props(props, all_params)

    return props

def all_content_csv_generator(pqs: list[ParsedQuery], user_id, is_staff, delay = 0.0) -> Callable[[],Generator[list, None, None]]:
    """
    returns function returning generator for "all content" CSV file
    with URLs from all queries.

    used for both immediate CSV download (download_all_content_csv)
    and emailed CSV (download_all_large_content_csv).

    NOTE!!! passing delay for "interactive" use would tie up the server process!!
    """
    def data_generator() -> Generator[list, None, None]:
        # phil: moved outside per-query loop (so headers appear once)
        first_page = True
        for pq in pqs:
            provider = pq_provider(pq)
            result = provider.all_items(pq.query, pq.start_date, pq.end_date, **pq.provider_props)
            for page in result:
                # NOTE! QuotaHistory.check_quota call should be done first by caller!
                QuotaHistory.increment(user_id, is_staff, pq.provider_name)
                if first_page:  # send back column names, which differ by platform
                    yield sorted(page[0].keys())
                    first_page = False
                for story in page:
                    yield [v for k, v in sorted(story.items())]
                if delay > 0.0:
                    time.sleep(delay)
    return data_generator

def pq_basename(pq: ParsedQuery, file_type: FileType) -> str:
    """
    ONE place to generate base file names (without .csv/txt/zip)
    (so one place to add or remove provider_name!)
    """
    # NOTE: server is running in UTC, so calling gmtime
    # (maybe add "Z" or "GMT"?)
    ts = time.strftime("%Y%m%d%H%M%S", time.gmtime())
    return f"mc-{pq.provider_name}-{ts}-{file_type.value}"
