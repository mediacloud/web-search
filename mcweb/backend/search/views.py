import json
import logging
import csv
import time
import collections
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from django.http import HttpResponse, HttpResponseBadRequest
from rest_framework.authentication import SessionAuthentication, BasicAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import action, authentication_classes, permission_classes
import backend.util.csv_stream as csv_stream
from .utils import parse_query, parse_query_array
from .tasks import download_all_large_content_csv
from ..users.models import QuotaHistory
from backend.users.exceptions import OverQuotaException
import mc_providers as providers
from mc_providers.exceptions import UnsupportedOperationException, QueryingEverythingUnsupportedQuery
from mc_providers import PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_WAYBACK_MACHINE, PLATFORM_REDDIT
from mc_providers.exceptions import ProviderException
from mc_providers.cache import CachingManager

from util.cache import django_caching_interface
logger = logging.getLogger(__name__)

# This is where we set the caching manager and the cache_time
CachingManager.caching_function = django_caching_interface(time_secs=60*60*24)

session = requests.Session()
retry = Retry(connect=3, backoff_factor=0.5)
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
session.mount('https://', adapter)

def error_response(msg: str):
    return HttpResponseBadRequest(json.dumps(dict(
        status="error",
        note=msg,
    )))


def handle_provider_errors(func):
    """
    If a provider-related method returns a JSON error we want to send it back to the client with information
    that can be used to show the user some kind of error.
    """
    def _handler(request):
        try:
            return func(request)
        except (ProviderException, OverQuotaException) as e:
            # these are expected errors, so just report the details msg to the user
            return error_response(str(e))
        except Exception as e:
            # these are internal errors we care about, so handle them as true errors
            logger.exception(e)
            return error_response(str(e))
    return _handler


@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def total_count(request):
    start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query(request)
    provider = providers.provider_by_name(provider_name, api_key)
    relevant_count = provider.count(query_str, start_date, end_date, **provider_props)
    try:
        total_content_count = provider.count(provider.everything_query(), start_date, end_date, **provider_props)
    except QueryingEverythingUnsupportedQuery as e:
        total_content_count = None
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name)
    return HttpResponse(json.dumps({"count": {"relevant": relevant_count, "total": total_content_count}}),
                        content_type="application/json", status=200)



@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def count_over_time(request):
    start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query(request)
    provider = providers.provider_by_name(provider_name, api_key)
    try:
        results = provider.normalized_count_over_time(query_str, start_date, end_date, **provider_props)
    except UnsupportedOperationException:
        # for platforms that don't support querying over time
        results = provider.count_over_time(query_str, start_date, end_date, **provider_props)
    response = results
    QuotaHistory.increment(
        request.user.id, request.user.is_staff, provider_name)
    return HttpResponse(json.dumps({"count_over_time": response}, default=str), content_type="application/json",
                        status=200)

@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def sample(request):
    start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query(request)
    provider = providers.provider_by_name(provider_name, api_key)
    try:
        response = provider.sample(query_str, start_date, end_date, **provider_props)
    except requests.exceptions.ConnectionError:
        response = {'error': 'Max Retries Exceeded'}
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name)
    return HttpResponse(json.dumps({"sample": response}, default=str), content_type="application/json",
                        status=200)

@handle_provider_errors
@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def story_detail(request):
    story_id = request.GET.get("storyId")
    platform = request.GET.get("platform")

    provider = providers.provider_by_name(platform)
    story_details = provider.item(story_id)
    # QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name)
    return HttpResponse(json.dumps({"story": story_details}, default=str), content_type="application/json",
                        status=200)

@handle_provider_errors
@require_http_methods(["POST"])
def sources(request):
    start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query(request)
    provider = providers.provider_by_name(provider_name, api_key)
    try:
        response = provider.sources(query_str, start_date,end_date, 10, **provider_props)
    except requests.exceptions.ConnectionError:
        response = {'error': 'Max Retries Exceeded'}
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 4)
    return HttpResponse(json.dumps({"sources": response}, default=str), content_type="application/json",
                        status=200)


@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def languages(request):
    start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query(request)
    provider = providers.provider_by_name(provider_name, api_key)
    try:
        response = provider.languages(query_str, start_date, end_date, **provider_props)
    except requests.exceptions.ConnectionError:
        response = {'error': 'Max Retries Exceeded'}
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 2)
    return HttpResponse(json.dumps({"languages": response}, default=str), content_type="application/json",
                        status=200)


@require_http_methods(["GET"])
@action(detail=False)
def download_languages_csv(request):
    queryState = json.loads(request.GET.get("qS"))
    data = []
    for query in queryState:
        start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query_array(query)
        provider = providers.provider_by_name(provider_name, api_key)
        if provider_name.split('-')[0] == PLATFORM_REDDIT:
            data.append(provider.languages(
                query_str, start_date, end_date, **provider_props))
        else:
            data.append(provider.languages(query_str, start_date,
                        end_date, **provider_props, sample_size=5000, limit=100))
        QuotaHistory.increment(
            request.user.id, request.user.is_staff, provider_name, 2)
    filename = "mc-{}-{}-top-languages.csv".format(
        provider_name, _filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    # TODO: extract into a constant (global)
    cols = ['language', 'count', 'ratio']
    writer.writerow(cols)
    for top_terms in data:
        for t in top_terms:
            writer.writerow([t["language"], t["value"], t['ratio']])
    return response


@handle_provider_errors
@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def words(request):
    start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query(request)
    provider = providers.provider_by_name(provider_name, api_key)
    try:
        words = provider.words(query_str, start_date,end_date, **provider_props)
    except requests.exceptions.ConnectionError:
        response = {'error': 'Max Retries Exceeded'}
    response = add_ratios(words)
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 4)
    return HttpResponse(json.dumps({"words": response}, default=str), content_type="application/json",
                        status=200)
                        


@require_http_methods(["GET"])
@action(detail=False)
def download_words_csv(request):
    queryState = json.loads(request.GET.get("qS"))
    data = []
    for query in queryState:
        start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query_array(query)
        provider = providers.provider_by_name(provider_name, api_key)
        if provider_name.split('-')[0] == PLATFORM_REDDIT:
            words = provider.words(query_str, start_date,
                                   end_date, **provider_props)
            words = add_ratios(words)
            data.append(words)
            QuotaHistory.increment(
                request.user.id, request.user.is_staff, provider_name, 4)
        else:
            words = provider.words(query_str, start_date,
                                   end_date, **provider_props, sample_size=5000)
            words = add_ratios(words)
            data.append(words)
            QuotaHistory.increment(
                request.user.id, request.user.is_staff, provider_name, 4)
    filename = "mc-{}-{}-top-words.csv".format(
        provider_name, _filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    # TODO: extract into a constant (global)
    cols = ['term', 'count', 'ratio']
    writer.writerow(cols)
    for top_terms in data:
        for t in top_terms:
            writer.writerow([t["term"], t["count"], t['ratio']])
    return response


@require_http_methods(["GET"])
@action(detail=False)
def download_counts_over_time_csv(request):
    queryState = json.loads(request.GET.get("qS"))
    data = []
    for query in queryState:
        start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query_array(query)
        provider = providers.provider_by_name(provider_name, api_key)
        try:
            data.append(provider.normalized_count_over_time(
                query_str, start_date, end_date, **provider_props))
            normalized = True
        except UnsupportedOperationException:
            data.append(provider.count_over_time(
                query_str, start_date, end_date, **provider_props))
            normalized = False
        QuotaHistory.increment(
            request.user.id, request.user.is_staff, provider_name, 2)
    filename = "mc-{}-{}-counts.csv".format(
        provider_name, _filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    # TODO: extract into a constant (global)
    cols = ['date', 'count', 'total_count',
            'ratio'] if normalized else ['date', 'count']
    writer.writerow(cols)
    for result in data:
        for day in result["counts"]:
            if 'ratio' in day:
                writer.writerow([day["date"], day["count"],
                                day["total_count"], day["ratio"]])
            else:
                writer.writerow([day["date"], day["count"]])
    return response


@login_required(redirect_field_name='/auth/login')
@require_http_methods(["GET"])
@action(detail=False)
def download_all_content_csv(request):
    queryState = json.loads(request.GET.get("qS"))
    data = []
    for query in queryState:
        start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query_array(query)
        provider = providers.provider_by_name(provider_name, api_key)
        data.append(provider.all_items(
            query_str, start_date, end_date, **provider_props))

    def data_generator():
        for result in data:
            first_page = True
            for page in result:
                QuotaHistory.increment(
                    request.user.id, request.user.is_staff, provider_name)
                if first_page:  # send back column names, which differ by platform
                    yield sorted(list(page[0].keys()))
                for story in page:
                    ordered_story = collections.OrderedDict(
                        sorted(story.items()))
                    yield [v for k, v in ordered_story.items()]
                first_page = False

    filename = "mc-{}-{}-content".format(
        provider_name, _filename_timestamp())
    streamer = csv_stream.CSVStream(filename, data_generator)
    return streamer.stream()


@login_required(redirect_field_name='/auth/login')
@handle_provider_errors
@require_http_methods(["POST"])
def send_email_large_download_csv(request):
    # get queryState and email
    payload = json.loads(request.body)
    queryState = payload.get('prepareQuery', None)
    email = payload.get('email', None)

    # follows similiar logic from download_all_content_csv, get information and send to tasks
    for query in queryState:
        start_date, end_date, query_str, provider_props, provider_name, api_key = parse_query_array(query)
        provider = providers.provider_by_name(provider_name, api_key)
        try:
            count = provider.count(query_str, start_date, end_date, **provider_props)
            if count >= 25000 and count <= 200000:
                download_all_large_content_csv(queryState, request.user.id, request.user.is_staff, email)
        except UnsupportedOperationException:
            return error_response("Can't count results for download in {}... continuing anyway".format(provider_name))
    return HttpResponse(content_type="application/json", status=200)

def add_ratios(words_data):
    for word in words_data:
        word["ratio"] = word['count'] / 1000
    return words_data


def _filename_timestamp() -> str:
    return time.strftime("%Y%m%d%H%M%S", time.localtime())
