import csv
import datetime as dt
import functools
import json
import logging
import time
from typing import Type

# PyPI
import mc_providers
import requests
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseBadRequest, HttpResponseForbidden, HttpResponse
from django_ratelimit.decorators import ratelimit
from django.views.decorators.http import require_http_methods
from mc_providers.exceptions import UnsupportedOperationException, QueryingEverythingUnsupportedQuery
from mc_providers.exceptions import PermanentProviderException, ProviderException, TemporaryProviderException
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import api_view, action, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from urllib3.util.retry import Retry

# mcweb
from settings import ALL_URLS_CSV_EMAIL_MAX, ALL_URLS_CSV_EMAIL_MIN

# mcweb/util
from util.cache import cache_by_kwargs, mc_providers_cacher
from util.csvwriter import CSVWriterHelper

# mcweb/backend/search (local dir)
from .utils import (
    ParsedQuery,
    all_content_csv_basename,
    all_content_csv_generator,
    filename_timestamp,
    parse_query,
    parse_query_params,
    parsed_query_from_dict,
    parsed_query_state,
    pq_provider
)
from .tasks import download_all_large_content_csv, download_all_queries_csv_task

# mcweb/backend/users
from ..users.models import QuotaHistory
from backend.users.exceptions import OverQuotaException

# mcweb/backend/util
import backend.util.csv_stream as csv_stream
import backend.util.stats

logger = logging.getLogger(__name__)
stats = backend.util.stats.Stats("search") # counters for search app

# enable caching for mc_providers results (explicitly referencing pkg for clarity)
mc_providers.cache.CachingManager.cache_function = mc_providers_cacher

def json_response(value: dict | str | None, *, _class: Type[HttpResponse] = HttpResponse) -> HttpResponse:
    """
    Send a generic JSON response.
    It's not intended that _class will be used by individual view
    functions, hence the leading underscore.
    """
    # NOTE! always passing default=str
    j = json.dumps(value, default=str)
    logger.debug("json_response %d %s", _class.status_code, j)
    return _class(j, content_type="application/json")

def error_response(msg: str, *, response_type: Type[HttpResponse] = HttpResponseBadRequest) -> HttpResponse:
    """
    Response_type now keyword required, since it's rarely needed, and
    additional required/positional fields could be added (two
    thoughts: error details hidden unless the user clicks something,
    the name of a counter to increment)

    Passing status code should not be needed: declarations of
    HttpResponse subclasses used here only differ by the status_code!
    If you need to report an error with a status code other than those
    available in django.http (ie; to indicate a temporary error),
    subclass HttpResponse with just "status_code = nnn" in the body of
    the class.
    """
    return json_response(
        dict(
            status="error",
            note=msg
        ),
        _class=response_type
    )

def massage_permanent_error_string(s: str) -> str:
    # for now, massage some errors here rather than in mc-providers
    # until we know exactly what we need/want to show.
    if s.startswith("parse_exception: "): # ES parse error
        _, s = s.split(": ", 1) # remove prefix
        # Note first line should have
        # "at line LINENO, column COLNO", so it might be possible to
        # show the user how far the parse got!
        s = s.split("\n")[0]    # just first line
    return s

def handle_provider_errors(func):
    """
    Decorator for view functions.

    If a provider-related method returns a JSON error we want to send it back to the client with information
    that can be used to show the user some kind of error.

    Now with stats keeping (but not all endpoints are wrapped with this decorator...)
    """
    @functools.wraps(func)      # propogates __name__
    def _handler(request):
        try:
            t0 = time.monotonic()
            ret = func(request)
            if ret.status_code == 200:
                stats.timing("success", func.__name__, time.monotonic() - t0)
        except PermanentProviderException as e:
            logger.debug("perm: %r", e, exc_info=True)
            s = massage_permanent_error_string(str(e))
            logger.debug("perm2: %s", s) # TEMP
            ret = error_response(s)
        except (requests.exceptions.ConnectionError, RuntimeError, TemporaryProviderException) as e:
            # handles the RuntimeError 500 a bad query string could have triggered this ...
            logger.debug("temp: %r", e, exc_info=True)
            # could conceivably send as a "503 Service Unavailable" error to indicate retryable
            ret = error_response("Search service is currently unavailable. This may be due to a temporary timeout or server issue. Please try again in a few moments.")
        except (ProviderException, OverQuotaException) as e:
            # these are expected errors, so just report the details msg to the user
            logger.debug("misc/quota: %r", e, exc_info=True)
            ret = error_response(str(e))
        except Exception as e:
            # these are internal errors we care about, so handle them as true errors
            logger.exception("unhandled exception: %r", e) # logs as error
            ret = error_response(str(e))

        stats.count("calls", func.__name__, labels=[("status", ret.status_code)])
        return ret

    return _handler


def _qs(pq: ParsedQuery) -> str:
    """
    removed paren wrapping (should not be needed with providers 3.0)
    because it confusifies parser error messages!

    function used to access query_str,
    in case reverting to paren wrapping needed in a hurry.
    _qs(pq) is shorter than _p(pq.query_str)
    """
    return pq.query_str

# TEMP FOR TEST/DEBUG
@handle_provider_errors
@api_view(['GET'])
def temporary_error(request):
    raise TemporaryProviderException("kilroy was here")

# TEMP FOR TEST/DEBUG
@handle_provider_errors
@api_view(['GET'])
def permanent_error(request):
    raise PermanentProviderException("hello world")

# TEMP FOR TEST/DEBUG
@handle_provider_errors
@api_view(['GET'])
def success(request):
    return json_response({"thing1": "thing2"})

@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def total_count(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    relevant_count = provider.count(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props)
    try:
        total_content_count = provider.count(provider.everything_query(), pq.start_date, pq.end_date, **pq.provider_props)
    except QueryingEverythingUnsupportedQuery as e:
        total_content_count = None
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name)
    return json_response({"count": {"relevant": relevant_count, "total": total_content_count}})



@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def count_over_time(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    try:
        results = provider.normalized_count_over_time(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props)
    except UnsupportedOperationException:
        # for platforms that don't support querying over time
        results = provider.count_over_time(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props)
    response = results
    QuotaHistory.increment(
        request.user.id, request.user.is_staff, pq.provider_name)
    return json_response({"count_over_time": response})

@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def sample(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    response = provider.sample(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props)
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name)
    return json_response({"sample": response})

@handle_provider_errors
@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def story_detail(request):
    pq, params = parse_query_params(request) # unlikely to handle POST!
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    story_id = params.get("storyId")
    platform = params.get("platform")
    provider = pq_provider(pq, platform)
    story_details = provider.item(story_id)
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name)
    if not request.user.is_staff: # maybe some group membership?
        del story_details['text']
    return json_response({"story": story_details})

@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def sources(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    response = provider.sources(_qs(pq), pq.start_date, pq.end_date, 10, **pq.provider_props)
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 4)
    return json_response({"sources": response})

@require_http_methods(["GET"])
@action(detail=False)
def download_sources_csv(request):
    queries = parsed_query_state(request) # handles POST!
    pq = queries[0]
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    
    # PB: was passing sample_size=5000
    data = provider.sources(_qs(pq), pq.start_date,
                            pq.end_date, **pq.provider_props, limit=100)
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 2)
    filename = "mc-{}-{}-top-sources".format(pq.provider_name, filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    # TODO: extract into a constant (global)
    cols = ['source', 'count']
    CSVWriterHelper.write_top_sources(writer, data, cols)
    return response


@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def languages(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    response = provider.languages(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props)
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 2)
    return json_response({"languages": response})


@require_http_methods(["GET"])
@action(detail=False)
def download_languages_csv(request):
    queries = parsed_query_state(request) # handles POST!
    pq = queries[0]
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    # PB: was passing sample_size=5000
    data = provider.languages(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props, limit=100)
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 2)
    filename = "mc-{}-{}-top-languages".format(pq.provider_name, filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    cols = ['language', 'count', 'ratio']
    CSVWriterHelper.write_top_langs(writer, data, cols)
    return response


@handle_provider_errors
@api_view(['GET'])
@authentication_classes([TokenAuthentication])  # API-only method for now
@permission_classes([IsAuthenticated])
@ratelimit(key="user", rate='util.ratelimit_callables.story_list_rate')
def story_list(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)

    # support returning text content for staff only
    if pq.provider_props.get('expanded') is not None:
        pq.provider_props['expanded'] = pq.provider_props['expanded'] == '1'
        if not request.user.is_staff:
            raise error_response("You are not permitted to fetch `expanded` stories.", response_type=HttpResponseForbidden)

    # NOTE! indexed_date is default sort key in MC ES provider, so no longer
    # strictly necessary, *BUT* it's presense here means users cannot pass it in
    # as an parameter.  This MAY be a feature, as it's possible to imagine that
    # some untested value(s) of sort_field might cause pathological behavior!
    page, pagination_token = provider.paged_items(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props, sort_field="indexed_date")
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 1)
    return json_response({"stories": page, "pagination_token": pagination_token})


@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def words(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    words = provider.words(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props)
    response = add_ratios(words)
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 4)
    return json_response({"words": response})
                        


@require_http_methods(["GET"])
@action(detail=False)
def download_words_csv(request):
    queries = parsed_query_state(request) # handles POST!
    pq = queries[0]
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    # PB: was passing sample_size=5000
    words = provider.words(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props)
    words = add_ratios(words)
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 4)
    filename = "mc-{}-{}-top-words".format(pq.provider_name, filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    cols = ['term', 'count', 'ratio']
    CSVWriterHelper.write_top_words(writer, words, cols)
    return response


@require_http_methods(["GET"])
@action(detail=False)
def download_counts_over_time_csv(request):
    queries = parsed_query_state(request) # handles POST!
    pq = queries[0]
    provider = pq_provider(pq)
    QuotaHistory.check_quota(request.user.id, request.user.is_staff, pq.provider_name)
    try:
        data = provider.normalized_count_over_time(
            _qs(pq), pq.start_date, pq.end_date, **pq.provider_props)
        normalized = True
    except UnsupportedOperationException:
        data = provider.count_over_time(pq.query_str, pq.start_date, pq.end_date, **pq.provider_props)
        normalized = False
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 2)
    filename = "mc-{}-{}-counts".format(
        pq.provider_name, filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    cols = ['date', 'count', 'total_count',
            'ratio'] if normalized else ['date', 'count']
    CSVWriterHelper.write_attn_over_time(writer, data, cols)
    return response


@login_required(redirect_field_name='/auth/login')
@require_http_methods(["GET"])
@action(detail=False)
def download_all_content_csv(request):
    parsed_queries = parsed_query_state(request) # handles POST!
    data_generator = all_content_csv_generator(parsed_queries, request.user.id, request.user.is_staff)
    filename = all_content_csv_basename(parsed_queries)
    streamer = csv_stream.CSVStream(filename, data_generator)
    return streamer.stream()


# called by frontend sendTotalAttentionDataEmail
@login_required(redirect_field_name='/auth/login')
@handle_provider_errors
@require_http_methods(["POST"])
def send_email_large_download_csv(request):
    # get queryState and email
    payload = json.loads(request.body)
    queryState = payload.get('prepareQuery')
    email = payload.get('email')

    # TotalAttentionEmailModal.jsx does range check_quota.
    # NOTE: download_all_content_csv doesn't check count!
    # applying range check to sum of all queries!
    total = 0
    for query in queryState:
        pq = parsed_query_from_dict(query, request)
        provider = pq_provider(pq)
        try:
            total += provider.count(_qs(pq), pq.start_date, pq.end_date, **pq.provider_props)
        except UnsupportedOperationException:
            # said "continuing anyway", but didn't!
            return error_response("Can't count results for download in {}".format(pq.provider_name))

    # phil: moved outside loop (was looping for all queries, AND sending all queries in email)!
    # was sending empty response regardless
    if total >= ALL_URLS_CSV_EMAIL_MIN and total <= ALL_URLS_CSV_EMAIL_MAX:
        # task arguments must be JSONifiable, so must pass queryState instead of pqs
        response = download_all_large_content_csv(queryState, request.user.id, request.user.is_staff, email)
        return json_response(response)
    else:
        return error_response("Total {} not between {} and {}".format(
            total, ALL_URLS_CSV_EMAIL_MIN, ALL_URLS_CSV_EMAIL_MAX))

@login_required(redirect_field_name='/auth/login')
@require_http_methods(["POST"])
@action(detail=False)
def download_all_queries_csv(request):
    queries = parsed_query_state(request) # handles GET with qS=JSON

    # make background task to fetch each query and zip into file then send email
    download_all_queries_csv_task(queries, request)
    # was: return HttpResponse(content_type="application/json", status=200)
    return json_response("")

def add_ratios(words_data):
    for word in words_data:
        word["ratio"] = word['count'] / 1000
    return words_data


