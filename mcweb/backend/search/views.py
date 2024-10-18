import csv
import datetime as dt
import json
import logging

# PyPI
import mc_providers
import requests
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseBadRequest, HttpResponseForbidden, HttpResponse
from django.views.decorators.http import require_http_methods
from mc_providers.exceptions import UnsupportedOperationException, QueryingEverythingUnsupportedQuery
from mc_providers.exceptions import ProviderException
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
    pq_provider,
    search_props_for_provider
)
from .tasks import download_all_large_content_csv, download_all_queries_csv_task

# mcweb/backend/users
from ..users.models import QuotaHistory
from backend.users.exceptions import OverQuotaException

# mcweb/backend/util
import backend.util.csv_stream as csv_stream

logger = logging.getLogger(__name__)

# enable caching for mc_providers results (explicitly referencing pkg for clarity)
mc_providers.cache.CachingManager.cache_function = mc_providers_cacher

def error_response(msg: str, response_type: HttpResponse | None) -> HttpResponse:
    ResponseClass = response_type or HttpResponseBadRequest
    return ResponseClass(json.dumps(dict(
        status="error",
        note=msg,
    )))

def handle_provider_errors(func):
    """
    Decorator for view functions.

    If a provider-related method returns a JSON error we want to send it back to the client with information
    that can be used to show the user some kind of error.
    """
    def _handler(request):
        try:
            return func(request)
        except (ProviderException, OverQuotaException) as e:
            # these are expected errors, so just report the details msg to the user
            return error_response(str(e), HttpResponseBadRequest)
        except Exception as e:
            # these are internal errors we care about, so handle them as true errors
            logger.exception(e)
            return error_response(str(e), HttpResponseBadRequest)
    return _handler


@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def total_count(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    relevant_count = provider.count(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
    try:
        total_content_count = provider.count(provider.everything_query(), pq.start_date, pq.end_date, **pq.provider_props)
    except QueryingEverythingUnsupportedQuery as e:
        total_content_count = None
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name)
    return HttpResponse(json.dumps({"count": {"relevant": relevant_count, "total": total_content_count}}),
                        content_type="application/json", status=200)



@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
# @cache_by_kwargs()
def count_over_time(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    try:
        results = provider.normalized_count_over_time(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
    except UnsupportedOperationException:
        # for platforms that don't support querying over time
        results = provider.count_over_time(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
    response = results
    QuotaHistory.increment(
        request.user.id, request.user.is_staff, pq.provider_name)
    return HttpResponse(json.dumps({"count_over_time": response}, default=str), content_type="application/json",
                        status=200)

@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
# @cache_by_kwargs()
def sample(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    try:
        response = provider.sample(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
    except requests.exceptions.ConnectionError:
        response = {'error': 'Max Retries Exceeded'}
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name)
    return HttpResponse(json.dumps({"sample": response}, default=str), content_type="application/json",
                        status=200)

@handle_provider_errors
@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
# @cache_by_kwargs()
def story_detail(request):
    pq, params = parse_query_params(request) # unlikely to handle POST!
    story_id = params.get("storyId")
    platform = params.get("platform")
    provider = pq_provider(pq, platform)
    story_details = provider.item(story_id)
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider)
    return HttpResponse(json.dumps({"story": story_details}, default=str), content_type="application/json",
                        status=200)

@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
# @cache_by_kwargs()
def sources(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    try:
        response = provider.sources(f"({pq.query_str})", pq.start_date, pq.end_date, 10, **pq.provider_props)
    except requests.exceptions.ConnectionError:
        response = {'error': 'Max Retries Exceeded'}
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 4)
    return HttpResponse(json.dumps({"sources": response}, default=str), content_type="application/json",
                        status=200)

@require_http_methods(["GET"])
@action(detail=False)
def download_sources_csv(request):
    queries = parsed_query_state(request) # handles POST!
    pq = queries[0]

    provider = pq_provider(pq)
    try:
        data = provider.sources(f"({pq.query_str})", pq.start_date,
                    pq.end_date, **pq.provider_props, sample_size=5000, limit=100)
    except Exception as e:
        logger.exception(e)
        return error_response(str(e), HttpResponseBadRequest)
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
# @cache_by_kwargs()
def languages(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    try:
        response = provider.languages(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
    except requests.exceptions.ConnectionError:
        response = {'error': 'Max Retries Exceeded'}
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 2)
    return HttpResponse(json.dumps({"languages": response}, default=str), content_type="application/json",
                        status=200)


@require_http_methods(["GET"])
@action(detail=False)
def download_languages_csv(request):
    queries = parsed_query_state(request) # handles POST!
    pq = queries[0]
    provider = pq_provider(pq)
    try:
        data = provider.languages(f"({pq.query_str})", pq.start_date,
                    pq.end_date, **pq.provider_props, sample_size=5000, limit=100)
    except Exception as e: 
        logger.exception(e)
        return error_response(str(e), HttpResponseBadRequest)
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
def story_list(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    # support returning text content for staff only
    if pq.provider_props.get('expanded') is not None:
        pq.provider_props['expanded'] = pq.provider_props['expanded'] == '1'
        if not request.user.is_staff:
            raise error_response("You are not permitted to fetch `expanded` stories.", HttpResponseForbidden)
    page, pagination_token = provider.paged_items(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props, sort_field="indexed_date")
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 1)
    return HttpResponse(json.dumps({"stories": page, "pagination_token": pagination_token}, default=str),
                        content_type="application/json",
                        status=200)


@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
# @cache_by_kwargs()
def words(request):
    pq = parse_query(request)
    provider = pq_provider(pq)
    try:
        words = provider.words(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
    except requests.exceptions.ConnectionError:
        response = {'error': 'Max Retries Exceeded'}
    response = add_ratios(words)
    QuotaHistory.increment(request.user.id, request.user.is_staff, pq.provider_name, 4)
    return HttpResponse(json.dumps({"words": response}, default=str), content_type="application/json",
                        status=200)
                        


@require_http_methods(["GET"])
@action(detail=False)
def download_words_csv(request):
    queries = parsed_query_state(request) # handles POST!
    pq = queries[0]
    provider = pq_provider(pq)
    try:
        words = provider.words(f"({pq.query_str})", pq.start_date,
                                pq.end_date, **pq.provider_props, sample_size=5000)
        words = add_ratios(words)
    except Exception as e:
        logger.exception(e)
        return error_response(str(e), HttpResponseBadRequest)
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
    try:
        data = provider.normalized_count_over_time(
            f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
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

    # TotalAttentionEmailModal.jsx does range check.
    # NOTE: download_all_content_csv doesn't check count!
    # applying range check to sum of all queries!
    total = 0
    for query in queryState:
        pq = parsed_query_from_dict(query)
        provider = pq_provider(pq)
        try:
            total += provider.count(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
        except UnsupportedOperationException:
            # said "continuing anyway", but didn't!
            return error_response("Can't count results for download in {}".format(pq.provider_name))

    # phil: moved outside loop (was looping for all queries, AND sending all queries in email)!
    # was sending empty response regardless
    if total >= ALL_URLS_CSV_EMAIL_MIN and total <= ALL_URLS_CSV_EMAIL_MAX:
        # task arguments must be JSONifiable, so must pass queryState instead of pqs
        response = download_all_large_content_csv(queryState, request.user.id, request.user.is_staff, email)
        return HttpResponse(json.dumps(response, default=str),
                            content_type="application/json", status=200)
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
    return HttpResponse(content_type="application/json", status=200)


def add_ratios(words_data):
    for word in words_data:
        word["ratio"] = word['count'] / 1000
    return words_data


