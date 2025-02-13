import csv
import datetime as dt
import json
import logging
import time
import traceback as tb
from typing import Type

# PyPI
import mc_providers
import requests
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseBadRequest, HttpResponseForbidden, HttpResponse
from django_ratelimit.decorators import ratelimit
from django.views.decorators.http import require_http_methods
from mc_providers.exceptions import (
    PermanentProviderException, ProviderException, ProviderParseException, QueryingEverythingUnsupportedQuery,
    TemporaryProviderException, UnsupportedOperationException)
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import api_view, action, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from urllib3.util.retry import Retry

# mcweb
from settings import ALL_URLS_CSV_EMAIL_MAX, ALL_URLS_CSV_EMAIL_MIN, AVAILABLE_PROVIDERS

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
    pq_provider,
    request_session_id
)
from .tasks import download_all_large_content_csv, download_all_queries_csv_task

# mcweb/backend/users
from ..users.models import QuotaHistory
from ..users.views import _user_from_token
from backend.users.exceptions import OverQuotaException

# mcweb/backend/util
import backend.util.csv_stream as csv_stream

TRACE_JSON_RESPONSE = False

logger = logging.getLogger(__name__)

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
    if TRACE_JSON_RESPONSE:
        logger.debug("json_response %d %s", _class.status_code, j)
    return _class(j, content_type="application/json")

def error_response(msg: str, *, exc: Exception | None = None,
                   response_type: Type[HttpResponse] = HttpResponseBadRequest,
                   temporary: bool = False,
                   traceback: bool = False,
                   ) -> HttpResponse:
    """
    NOTE! Optional args all keyword required.

    Passing status code should not be needed: declarations of HttpResponse only differ by
    the status_code class member.  If a different status_code is needed, subclass
    HttpResponse.

    "temporary" means a transient condition.  would like to return a different HTTP
    response code (ie; 503 Service Unavailable) to indicate to API clients the temporary
    nature of the error, but django regards returning anything >= 500 as an internal error
    (logs at ERROR level, which can generate admin emails), so added to JSON response.
    """
    response = dict(status="error", note=msg)
    if exc:
        # detailed info (for optional display)
        response["exception"] = repr(exc)

        if traceback:
            # show the file, line number, and the line of code (trying to
            # limit payload and info leakage, if neither is a problem, or
            # this turns out to be flakey, could pass back the entire list):
            response["traceback"] = tb.format_exception(exc)[-2]
    if temporary:
        response["temporary"] = True
    return json_response(response, _class=response_type)


# User-friendly text for a temporary (transient) error.  Added to replace the
# "RuntimeError 500 a bad query string could have triggered this ..."  message from
# news-search-api.  It might be temporary solution, and can be replaced (for the most
# part) by more specific responses by having providers raise
# {Temporary,Permanent,Myster}ProviderExceptions which contain user-friendly messages.
# Moved outside function when it looked like it would be used in multiple cases.
TEMPORARY_ERROR_MESSAGE = "Search service is currently unavailable. This may be due to a temporary timeout or server issue. Please try again in a few moments."

def handle_provider_errors(func):
    """
    Decorator for view functions calling mc-providers.
    Handle exceptions and translate to HttpResponse with JSON payload
    """
    def _handler(request):
        def _get_user():
            if request.user.is_authenticated:
                return str(request.user)
            else:
                return "Anonymous"

        # PB: I've fallen into a rabbit hole; there are numerous variables in play:
        # 1. what string(s) are returned in response (from the exception, or a replacement),
        # 2. whether to log, at what level, include user, log traceback
        # 3. whether to indicate in response condition is temporary and can be retried.
        # Code is likely to change over time, and be hard to fully test,
        # so I'm tempted to say it could be done as a JSON or YAML file
        # that maps exception class names to a list of actions/conditions!
        try:
            return func(request)
        except (requests.exceptions.ConnectionError, TemporaryProviderException) as e:
            # Temporary conditions
            return error_response(TEMPORARY_ERROR_MESSAGE, exc=e, temporary=True)
        except (OverQuotaException, ProviderParseException) as e:
            # expected, self-explanatory errors (str(e) should be user friendly)
            # no traceback logged.  Passing exc for detail from repr(e)
            return error_response(str(e), exc=e)
        except RuntimeError as e:
            # RuntimeError is very broad (Python internal errors, Django errors,
            # and mc-providers errors), often without subclassing.  Logging traceback
            # at debug level so they're visible in development to see if any need
            # better handling.
            logger.debug("RuntimeError %r", e, exc_info=True)
            return error_response(str(e), exc=e)
        except ProviderException as e:
            # ProviderException includes Provider{Permanent,Mystery}Exceptions.
            # Log exception/trace as warning to identify cases that
            # can be subclassed into more specific classes (or marked
            # that no traceback is needed).  Send traceback detail to client,
            # log traceback with user name to aid locating reported problems.
            logger.warning("%r for user %s", e, _get_user(), exc_info=True)
            return error_response(str(e), exc=e, traceback=True)
        except Exception as e:
            # these are internal errors we care about, so handle them as true errors
            # log traceback with user name to aid locating reported problems.
            logger.exception("unhandled exception: %r for user %s", e, _get_user())
            return error_response(str(e), exc=e, traceback=True)

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
    session_id = request_session_id(request)
    for query in queryState:
        pq = parsed_query_from_dict(query, session_id)
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

@handle_provider_errors
@api_view(['GET'])
@authentication_classes([TokenAuthentication]) #API only method for now
@permission_classes([IsAuthenticated])
def providers(request):
    token = request.GET.get('Authorization', None)
    if token:
        user = _user_from_token(token)
        providers = {
            AVAILABLE_PROVIDERS[0]: user.profile.quota_mediacloud,
            AVAILABLE_PROVIDERS[1]: user.profile.quota_wayback_machine,
        }
        return json_response({"providers": providers})
    else:
        return error_response("No token provided", response_type=HttpResponseBadRequest)

def add_ratios(words_data):
    for word in words_data:
        if "ratio" not in word:
            word["ratio"] = word['count'] / 1000
    return words_data


