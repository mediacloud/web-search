"""
No ViewSets here!
"""

import csv
import datetime as dt
import functools
import json
import logging
import time

# PyPI
import requests
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseBadRequest, HttpResponseForbidden, HttpResponse, HttpRequest
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from django.views.decorators.http import require_http_methods
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import api_view, action, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.request import Request
from urllib3.util.retry import Retry

# mediacloud: no longer in PyPI
import mc_providers
from mc_providers.exceptions import (
    PermanentProviderException, ProviderException, ProviderParseException, QueryingEverythingUnsupportedQuery,
    TemporaryProviderException, UnsupportedOperationException
)

# mcweb
from settings import ALL_URLS_CSV_EMAIL_MAX, ALL_URLS_CSV_EMAIL_MIN, AVAILABLE_PROVIDERS, API_PYTHON_CLIENT

# mcweb/util
from util.cache import cache_by_kwargs, mc_providers_cacher
from util.csvwriter import CSVWriterHelper
from util.stats import api_stats
from util.exceptions import HttpResponseUnprocessableEntity, UserValueError
from util.ratelimit_callables import query_rate

# mcweb/backend/search (local dir)
from .utils import (
    FileType,
    ParsedQuery,
    all_content_csv_generator,
    parse_query,
    parse_query_params,
    parsed_query_from_dict,
    parsed_query_state,
    pq_basename,
    pq_provider,
    request_session_id
)
from .tasks import download_all_large_content_csv
from .read_requests import read_requests, make_table

# mcweb/backend/users
from ..users.models import QuotaHistory
from ..users.views import _user_from_token
from backend.users.exceptions import OverQuotaException

# mcweb/backend/util
import backend.util.csv_stream as csv_stream
from backend.util.response import json_response, error_response, quota_exceeded, rate_exceeded

# TEMP: enforce SOME limit on csv endpoints!
CSV_RATE_LIMIT = "6/m"

class Cost:
    """
    quota increment values, for consistency.
    in an object for easy import by test files.
    (if you change a cost, the test will present itself,
     and you can fix the test to use this)
    """
    ITEM = 1
    LANG = 2
    PAGE = 1
    RANDOM = 1        # random page
    SAMPLE = 1
    SRCS = 4
    COT = 1           # count over time
    TOTAL = 1
    TWO_D = 4
    WORDS = 4

logger = logging.getLogger(__name__)

# enable caching for mc_providers results (explicitly referencing pkg for clarity)
mc_providers.cache.CachingManager.cache_function = mc_providers_cacher

# User-friendly text for a temporary (transient) error.  Added to replace the
# "RuntimeError 500 a bad query string could have triggered this ..."  message from
# news-search-api.  It might be temporary solution, and can be replaced (for the most
# part) by more specific responses by having providers raise
# {Temporary,Permanent,Myster}ProviderExceptions which contain user-friendly messages.
# Moved outside function when it looked like it would be used in multiple cases.
TEMPORARY_ERROR_MESSAGE = "Search service is currently unavailable. This may be due to a temporary timeout or server issue. Please try again in a few moments."

def _get_user(request):
    if request.user.is_authenticated:
        return str(request.user)
    else:
        return "Anonymous"

def stats_errs(func):
    """
    local decorator.
    merger of api_stats, handle_provider_errors, handle_429.
    handles:
    * stats (counts and timing) reporting
    * translate rate and quota exceptions

    If kept first timings will be all encompassing
    """
    @functools.wraps(func)
    @api_stats
    def _handler(request):
        # PB: I've fallen into a rabbit hole; there are numerous variables in play:
        # 1. what string(s) are returned in response (from the exception, or a replacement),
        # 2. whether to log, at what level, include user, log traceback
        # 3. whether to indicate in response condition is temporary and can be retried.
        try:
            return func(request)
        except (requests.exceptions.ConnectionError, TemporaryProviderException) as e:
            # Temporary conditions
            return error_response(TEMPORARY_ERROR_MESSAGE, exc=e, temporary=True,
                                  request=request)
        except Ratelimited as e: # subclass of django.core.exceptions.PermissionDenied
            return rate_exceeded(e, request)
        except OverQuotaException as e:
            return quota_exceeded(e, request)
        except ProviderParseException as e:
            # expected, self-explanatory errors (str(e) should be user friendly)
            # no traceback logged.  Passing exc for detail from repr(e)
            return error_response(str(e), exc=e, request=request)
        except RuntimeError as e:
            # RuntimeError is very broad (Python internal errors, Django errors,
            # and mc-providers errors), often without subclassing.  Logging traceback
            # at debug level so they're visible in development to see if any need
            # better handling.
            logger.debug("RuntimeError %r", e, exc_info=True)
            return error_response(str(e), exc=e, request=request)
        except UserValueError as e:
            # ValueErrors will be thrown when the user provides bad input
            # Should be the same handling flow as Runtime errors.
            logger.debug("%r", e) # repr includes class name; removed exc_info: too many notes!
            return error_response(str(e), response_type=HttpResponseUnprocessableEntity, exc=e,
                                  request=request)
        except ProviderException as e:
            # ProviderException includes Provider{Permanent,Mystery}Exceptions.
            # Log exception/trace as warning to identify cases that
            # can be subclassed into more specific classes (or marked
            # that no traceback is needed).  Send traceback detail to client,
            # log traceback with user name to aid locating reported problems
            # (FOR NOW):
            logger.warning("%r for user %s", e, _get_user(request), exc_info=True)
            return error_response(str(e), exc=e, traceback=True,
                                  request=request)
        except Exception as e:
            # these are internal errors we care about, so handle them as true errors
            # log traceback with user name to aid locating reported problems.
            logger.exception("unhandled exception: %r for user %s", e, _get_user(request))
            return error_response(str(e), exc=e, traceback=True, request=request)
    return _handler

@stats_errs
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=query_rate)
def total_count(request):
    pq = parse_query(request)
    provider = pq_provider(pq)

    # NOTE: current cost is one, regardless of the fact it does two OVERVIEW queries
    with QuotaHistory.context(request.user, pq.provider_name, Cost.TOTAL):
        relevant_count = provider.count(pq.query, pq.start_date, pq.end_date, **pq.provider_props)
        try:
            total_content_count = provider.count(provider.everything_query(), pq.start_date, pq.end_date, **pq.provider_props)
        except QueryingEverythingUnsupportedQuery as e:
            total_content_count = None
    return json_response({"count": {"relevant": relevant_count, "total": total_content_count}})

def csv_response(filename: str) -> HttpResponse:
    assert filename.endswith(".csv")
    return HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}"},
    )

def csv_response_pq_type(pq: ParsedQuery, type: FileType) -> HttpResponse:
    filename = pq_basename(pq, type) + ".csv"
    return csv_response(filename)

def _count_over_time(request, pq):
    """
    returns (normalized, data)
    """
    provider = pq_provider(pq)
    with QuotaHistory.context(request.user, pq.provider_name, Cost.COT):
        try:
            return (True, provider.normalized_count_over_time(pq.query, pq.start_date, pq.end_date, **pq.provider_props))
        except UnsupportedOperationException:
            # for platforms that don't support querying over time
            return (False, provider.count_over_time(pq.query, pq.start_date, pq.end_date, **pq.provider_props))

@stats_errs
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=query_rate)
def count_over_time(request):
    pq = parse_query(request)
    normalized, results = _count_over_time(request, pq)
    return json_response({"count_over_time": results})


@stats_errs
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=query_rate)
def count_by_source_over_interval(request):
    pq, params = parse_query_params(request)
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)

    interval = str(params.get("interval", "week")).lower()
    valid_intervals = {"day", "week", "month", "year"}
    if interval not in valid_intervals:
        return error_response(
            f"Invalid interval '{interval}'. Must be one of: {', '.join(sorted(valid_intervals))}"
        )

    domains = pq.provider_props.get("domains", [])
    if not domains:
        return error_response("No domains selected for source-over-interval query.")

    date_span_days = (pq.end_date - pq.start_date).days + 1
    if date_span_days <= 0:
        return error_response("Invalid date range: end_date must be on or after start_date.")

    if interval == "day":
        num_intervals = date_span_days
    elif interval == "week":
        num_intervals = max(1, (date_span_days + 6) // 7)
    elif interval == "month":
        num_intervals = max(
            1,
            (pq.end_date.year - pq.start_date.year) * 12
            + (pq.end_date.month - pq.start_date.month)
            + 1
        )
    else:  # year
        num_intervals = max(1, (pq.end_date.year - pq.start_date.year) + 1)

    max_buckets = provider.MAX_2D_AGG_BUCKETS
    if num_intervals * len(domains) > max_buckets:
        return error_response(
            f"Too many sources*time-buckets selected for this query (max {max_buckets})"
        )

    with QuotaHistory.context(request.user, pq.provider_name, incr=Cost.TWO_D):
        matching = provider.two_d_aggregation(
            query=pq.query,
            start_date=pq.start_date,
            outer_field="publish_date",
            inner_field="media_name",
            interval=interval,
            num_intervals=num_intervals,
            domains=domains
        )
        totals = provider.two_d_aggregation(
            query='*',
            start_date=pq.start_date,
            outer_field="publish_date",
            inner_field="media_name",
            interval=interval,
            num_intervals=num_intervals,
            domains=domains
        )

    shaped_data = []
    for media in domains:
        for bucket, values in totals["buckets"].items():
            total = values.get(media, 0)
            count = matching["buckets"].get(bucket, {}).get(media, 0)
            shaped_data.append({
                "media_name": media,
                "interval": interval,
                "bucket": bucket,
                "matching_stories": count,
                "total_stories": total,
                "ratio": (count / total) if total > 0 else 0
            })
    return json_response({"source-interval-attention": shaped_data})

@stats_errs
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=query_rate)
def sample(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    with QuotaHistory.context(request.user, pq.provider_name, Cost.SAMPLE):
        response = provider.sample(pq.query, pq.start_date, pq.end_date, **pq.provider_props)
    return json_response({"sample": response})

@stats_errs
@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=query_rate)
def story_detail(request):
    pq, params = parse_query_params(request, is_search=False) # unlikely to handle POST!
    story_id = params.get("storyId")
    platform = params.get("platform")
    provider = pq_provider(pq, platform)
    with QuotaHistory.context(request.user, pq.provider_name, incr=Cost.ITEM):
        story_details = provider.item(story_id)
    if not request.user.is_staff: # maybe some group membership?
        del story_details['text']
    return json_response({"story": story_details})


def _sources(request, pq):
    provider = pq_provider(pq)
    with QuotaHistory.context(request.user, pq.provider_name, incr=Cost.SRCS):
        return provider.sources(pq.query, pq.start_date, pq.end_date, **pq.provider_props)

@stats_errs
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=query_rate)
def sources(request):
    pq = parse_query(request, limit=100)
    response = _sources(request, pq)
    return json_response({"sources": response})

@stats_errs
@login_required(login_url='/sign-in')
@require_http_methods(["GET"])
@action(detail=False)
@ratelimit(key="user", rate=CSV_RATE_LIMIT) # TEMP
def download_sources_csv(request):
    queries = parsed_query_state(request, limit=100) # handles POST!
    pq = queries[0]
    data = _sources(request, pq)
    total_count = sum(item['count'] for item in data)
    for item in data:
        item['ratio'] = item['count'] / total_count if total_count > 0 else 0

    response = csv_response_pq_type(pq, FileType.TOP_SOURCES)
    writer = csv.writer(response)
    # TODO: extract into a constant (global)
    cols = ['source', 'count', 'ratio']
    CSVWriterHelper.write_top_sources(writer, data, cols)
    return response

def _languages(request, pq):
    provider = pq_provider(pq)
    with QuotaHistory.context(request.user, pq.provider_name, incr=Cost.LANG):
        return provider.languages(pq.query, pq.start_date, pq.end_date, **pq.provider_props)

@stats_errs
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=query_rate)
def languages(request):
    pq = parse_query(request)
    response = _languages(request, pq)
    return json_response({"languages": response})


@stats_errs
@login_required(login_url='/sign-in')
@require_http_methods(["GET"])
@action(detail=False)
@ratelimit(key="user", rate=CSV_RATE_LIMIT) # TEMP
def download_languages_csv(request):
    queries = parsed_query_state(request, limit=100) # handles POST!
    pq = queries[0]
    data = _languages(request, pq)
    response = csv_response_pq_type(pq, FileType.TOP_LANGUAGES)
    writer = csv.writer(response)
    cols = ['language', 'count', 'ratio']
    CSVWriterHelper.write_top_langs(writer, data, cols)
    return response


@stats_errs
@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=query_rate)
def story_list(request):
    pq = parse_query(request)
    provider = pq_provider(pq)

    # support returning text content for staff only
    if pq.provider_props.get('expanded') is not None:
        # NOTE! If ever takes POST, will need to handle int here!
        expanded = pq.provider_props['expanded'] = pq.provider_props['expanded'] == '1'
        if expanded and not request.user.is_staff:
            return error_response("You are not permitted to fetch `expanded` stories.", response_type=HttpResponseForbidden)

    # support page random sort, for staff only because compute cost is likely high after a handful of pages
    cost = Cost.PAGE
    if pq.provider_props.get('randomize') is not None:
        # NOTE! If ever takes POST, will need to handle int here!
        randomize = pq.provider_props['randomize'] = pq.provider_props['randomize'] == '1'
        if randomize:
            if not request.user.is_staff:
                return error_response("You are not permitted to fetch randomized stories due to server load concerns.",
                                      response_type=HttpResponseForbidden)
            cost = Cost.RANDOM

    # NOTE! indexed_date is default sort key in MC ES provider, so no longer
    # strictly necessary, *BUT* it's presense here means users cannot pass it in
    # as an parameter.  This MAY be a feature, as it's possible to imagine that
    # some untested value(s) of sort_field might cause pathological behavior!
    with QuotaHistory.context(request.user, pq.provider_name, cost):
        page, pagination_token = provider.paged_items(pq.query, pq.start_date, pq.end_date, **pq.provider_props, sort_field="indexed_date")
    return json_response({"stories": page, "pagination_token": pagination_token})


def _words(request, pq):
    provider = pq_provider(pq)
    with QuotaHistory.context(request.user, pq.provider_name, incr=Cost.WORDS):
        return provider.words(pq.query, pq.start_date, pq.end_date, **pq.provider_props)

@stats_errs
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate=query_rate)
def words(request):
    pq = parse_query(request)
    response = _words(request, pq)
    return json_response({"words": response})


@stats_errs
@login_required(login_url='/sign-in')
@require_http_methods(["GET"])
@action(detail=False)
@ratelimit(key="user", rate=CSV_RATE_LIMIT) # TEMP
def download_words_csv(request):
    queries = parsed_query_state(request) # handles POST!
    pq = queries[0]
    words = _words(request, pq)
    response = csv_response_pq_type(pq, FileType.TOP_WORDS)
    writer = csv.writer(response)
    cols = ['term', 'term_count', 'term_ratio', 'doc_count', 'doc_ratio', 'sample_size']
    CSVWriterHelper.write_top_words(writer, words, cols)
    return response


@stats_errs
@login_required(login_url='/sign-in')
@require_http_methods(["GET"])
@action(detail=False)
@ratelimit(key="user", rate=CSV_RATE_LIMIT) # TEMP
def download_counts_over_time_csv(request):
    queries = parsed_query_state(request) # handles POST!
    pq = queries[0]
    normalized, data = _count_over_time(request, pq)
    response = csv_response_pq_type(pq, FileType.COUNTS)
    writer = csv.writer(response)
    cols = ['date', 'count', 'total_count',
            'ratio'] if normalized else ['date', 'count']
    CSVWriterHelper.write_attn_over_time(writer, data, cols)
    return response

def _total_for_all_queries(request, parsed_queries):
    total = 0
    for pq in parsed_queries:
        # XXX maybe sum totals by provider_name and check user has
        # enough remaining quota to retrieve count/pagesize pages????
        # for now, just check they're not already over quota (no charge for the count)
        QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
        provider = pq_provider(pq)
        total += provider.count(pq.query, pq.start_date, pq.end_date, **pq.provider_props)
    return total

@stats_errs
@login_required(login_url='/sign-in')
@require_http_methods(["GET"])
@action(detail=False)
@ratelimit(key="user", rate=CSV_RATE_LIMIT) # TEMP
def download_all_content_csv(request):
    parsed_queries = parsed_query_state(request) # handles POST!

    # get result total to verify in range:
    try:
        total = _total_for_all_queries(request, parsed_queries)
    except UnsupportedOperationException:
        return error_response(f"Can't count results for download", request=request)

    if total >= ALL_URLS_CSV_EMAIL_MIN:
        return error_response(f"Total {total} >= {ALL_URLS_CSV_EMAIL_MIN}",
                              request=request)
    # paranoia (should not happen if ALL_URLS_CSV_EMAIL_MIN < ALL_URLS_CSV_EMAIL_MAX!)
    if total > ALL_URLS_CSV_EMAIL_MAX:
        return error_response(f"Total {total} >= {ALL_URLS_CSV_EMAIL_MAX}",
                              request=request)

    data_generator = all_content_csv_generator(parsed_queries, request.user.id, request.user.is_staff)
    filename = pq_basename(parsed_queries[-1], FileType.ALL_CONTENT)
    return csv_stream.streaming_csv_response(data_generator, filename)


# called by frontend sendTotalAttentionDataEmail
@stats_errs
@login_required(login_url='/sign-in')
@require_http_methods(["POST"])
@ratelimit(key="user", rate=CSV_RATE_LIMIT) # TEMP
def send_email_large_download_csv(request):
    # get queryState and email
    payload = json.loads(request.body)
    queryState = payload.get('prepareQuery')
    email = payload.get('email')

    # TotalAttentionEmailModal.jsx does range check_quota.
    # NOTE: download_all_content_csv doesn't check count!
    # applying range check to sum of all queries!
    session_id = request_session_id(request)
    try:
        total = _total_for_all_queries(
            request,
            (parsed_query_from_dict(query, session_id)
            for query in queryState)
        )
    except UnsupportedOperationException:
        return error_response(f"Can't count results for emailed csv", request=request)

    # phil: moved outside loop (was looping for all queries, AND sending all queries in email)!
    # was sending empty response regardless
    if total >= ALL_URLS_CSV_EMAIL_MIN and total <= ALL_URLS_CSV_EMAIL_MAX:
        # task arguments must be JSONifiable, so must pass queryState instead of pqs
        response = download_all_large_content_csv(queryState, request.user.id, request.user.is_staff, email)
        return json_response(response)
    else:
        return error_response("Total {} not between {} and {}".format(
            total, ALL_URLS_CSV_EMAIL_MIN, ALL_URLS_CSV_EMAIL_MAX))

# PB 9/26: IS THIS USED???  It works, but only if supplied
# "Authorization" as a ***QUERY PARAMETER***, with value "Token
# <TOKEN>"!!!  NONETHELESS, I've fixed it to honor AVAILABLE_PROVIDERS
# and use Profile.quota_for to handle NULL for MC default quota.
@stats_errs
@api_view(['GET'])
@authentication_classes([TokenAuthentication]) #API only method for now
@permission_classes([IsAuthenticated])
def providers(request):
    logger.warning("views.providers called!") # 2026-10-21
    token = request.GET.get('Authorization', None)
    if token:
        user = _user_from_token(token)
        providers = {
            provider: user.profile.quota_for(provider)
            for provider in AVAILABLE_PROVIDERS
        }
        return json_response({"providers": providers})
    else:
        return error_response("No token provided", response_type=HttpResponseBadRequest)
    

@stats_errs
@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAdminUser])
def recent_requests(request):
    rows = read_requests(want=100, srcs=True, status=200)   # take query params?
    if request.headers.get("Accept") == "application/json":
        return json_response({"requests": rows}) # JSON only request

    # TEMP!!!!! not a pure JSON request: send HTML
    body = make_table(rows)
    return HttpResponse(body, content_type='text/html; charset=utf-8')

@stats_errs
@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def api_params(request):
    # return data helpful to client libraries in one swell foop
    params = {
        "api-python-client": API_PYTHON_CLIENT, # current/best client
        "query-rate": query_rate("", request),
    }
    return json_response({"params": params})
