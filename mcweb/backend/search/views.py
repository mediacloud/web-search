import json
import logging
import csv
import time
import collections
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import action
import backend.util.csv_stream as csv_stream
from .utils import parse_query
from ..users.models import QuotaHistory
from backend.users.exceptions import OverQuotaException
import mc_providers as providers
from mc_providers.exceptions import UnsupportedOperationException, QueryingEverythingUnsupportedQuery
from mc_providers import PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_WAYBACK_MACHINE, PLATFORM_REDDIT
from mc_providers.exceptions import ProviderException
from mc_providers.cache import CachingManager

from util.cache import django_caching_interface
logger = logging.getLogger(__name__)

#This is where we set the caching manager and the cache_time
CachingManager.caching_function = django_caching_interface(time_secs = 60*60*24)

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


@login_required(redirect_field_name='/auth/login')
@handle_provider_errors
@require_http_methods(["POST"])
def total_count(request):
    payload = json.loads(request.body).get("queryObject")
    total_content_count = []
    relevant_count = []
    for query in payload:
        start_date, end_date, query_str, provider_props, provider_name = parse_query(request)
        provider = providers.provider_by_name(provider_name)
        relevant_count.append(provider.count(query_str, start_date, end_date, **provider_props))
        try:
            total_content_count.append(provider.count(provider.everything_query(), start_date, end_date, **provider_props))
            QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 2)
        except QueryingEverythingUnsupportedQuery as e:
            total_content_count = None
            QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name)
        # everything_count = provider.normalized_count_over_time(query_str, start_date, end_date, **provider_props)
    return HttpResponse(json.dumps({"count": {"relevant": relevant_count, "total": total_content_count}}),
                        content_type="application/json", status=200)


@login_required(redirect_field_name='/auth/login')
@handle_provider_errors
@require_http_methods(["POST"])
def count_over_time(request):
    print("testing")
    payload = json.loads(request.body).get("queryObject")
    response = []
    for query in payload:
        print(query) 
        start_date, end_date, query_str, provider_props, provider_name = parse_query(query)
        provider = providers.provider_by_name(provider_name)
        try:
            results = provider.normalized_count_over_time(query_str, start_date, end_date, **provider_props)
        except UnsupportedOperationException:
            # for platforms that don't support querying over time
            results = provider.count_over_time(query_str, start_date, end_date, **provider_props)
        QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name)
        #logger.debug("NORMALIZED COUNT OVER TIME: %, %".format(start_date, end_date))
        response.append(results)
    return HttpResponse(json.dumps({"count_over_time": response}, default=str), content_type="application/json",
                        status=200)
    # return HttpResponse(json.dumps({"count_over_time": results}, default=str), content_type="application/json",
    #                     status=200)


@login_required(redirect_field_name='/auth/login')
@handle_provider_errors
@require_http_methods(["POST"])
def sample(request):
    payload = json.loads(request.body).get("queryObject")
    response = []

    start_date, end_date, query_str, provider_props, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    sample_stories = provider.sample(query_str, start_date, end_date, **provider_props)
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name)
    return HttpResponse(json.dumps({"sample": sample_stories }, default=str), content_type="application/json",
                        status=200)

@login_required(redirect_field_name='/auth/login')
@handle_provider_errors
@require_http_methods(["GET"])
def story_detail(request):
    story_id = request.GET.get("storyId")
    provider_name = providers.provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_WAYBACK_MACHINE)
    provider = providers.provider_by_name(provider_name)
    story_details = provider.item(story_id)
    # QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name)
    return HttpResponse(json.dumps({"story": story_details }, default=str), content_type="application/json",
                        status=200)


@handle_provider_errors
@require_http_methods(["POST"])
def languages(request):
    payload = json.loads(request.body).get("queryObject")
    response = []

    start_date, end_date, query_str, provider_props, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    sample_stories = provider.languages(query_str, start_date, end_date, **provider_props)
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 2)
    return HttpResponse(json.dumps({"languages": sample_stories}, default=str), content_type="application/json",
                        status=200)


@require_http_methods(["GET"])
@action(detail=False)
def download_languages_csv(request):
    start_date, end_date, query_str, provider_props, provider_name = parse_query(request, 'GET')
    provider = providers.provider_by_name(provider_name)
    top_terms = provider.languages(query_str, start_date, end_date, **provider_props, sample_size=5000, limit=100)
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 2)
    filename = "mc-{}-{}-top-languages.csv".format(provider_name, _filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    # TODO: extract into a constant (global)
    cols = ['language', 'count', 'ratio']
    writer.writerow(cols)
    for t in top_terms:
        writer.writerow([t["language"], t["count"], t['ratio']])
    return response


@handle_provider_errors
@require_http_methods(["POST"])
def words(request):
    payload = json.loads(request.body).get("queryObject")
    response = []

    start_date, end_date, query_str, provider_props, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    sample_stories = provider.words(query_str, start_date, end_date, **provider_props)
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 4)
    return HttpResponse(json.dumps({"words": sample_stories}, default=str), content_type="application/json",
                        status=200)


@require_http_methods(["GET"])
@action(detail=False)
def download_words_csv(request):
    start_date, end_date, query_str, provider_props, provider_name = parse_query(request, 'GET')
    provider = providers.provider_by_name(provider_name)
    if provider_name.split('-')[0] == PLATFORM_REDDIT:
        top_terms = provider.words(query_str, start_date, end_date, **provider_props)
        QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 4)
    else: 
        top_terms = provider.words(query_str, start_date, end_date, **provider_props, sample_size=5000)
        QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 4)
    filename = "mc-{}-{}-top-words.csv".format(provider_name, _filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    # TODO: extract into a constant (global)
    cols = ['term', 'count', 'ratio']
    writer.writerow(cols)
    for t in top_terms:
        writer.writerow([t["term"], t["count"], t['ratio']])
    return response


@require_http_methods(["GET"])
@action(detail=False)
def download_counts_over_time_csv(request):
    start_date, end_date, query_str, provider_props, provider_name = parse_query(request, 'GET')
    provider = providers.provider_by_name(provider_name)
    try:
        counts_data = provider.normalized_count_over_time(query_str, start_date, end_date, **provider_props)
        normalized = True
    except UnsupportedOperationException:
        counts_data = provider.count_over_time(query_str, start_date, end_date, **provider_props)
        normalized = False
    QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name, 2)
    filename = "mc-{}-{}-counts.csv".format(provider_name, _filename_timestamp())
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': f"attachment; filename={filename}.csv"},
    )
    writer = csv.writer(response)
    # TODO: extract into a constant (global)
    cols = ['date', 'count', 'total_count', 'ratio'] if normalized else ['date', 'count']
    writer.writerow(cols)
    for day in counts_data["counts"]:
        if 'ratio' in day:
            writer.writerow([day["date"], day["count"], day["total_count"], day["ratio"]])
        else:
            writer.writerow([day["date"], day["count"]])
    return response


@login_required(redirect_field_name='/auth/login')
@require_http_methods(["GET"])
@action(detail=False)
def download_all_content_csv(request):
    start_date, end_date, query_str, provider_props, provider_name = parse_query(request, 'GET')
    provider = providers.provider_by_name(provider_name)
    # try to not allow allow gigantic downloads
    try:
        count = provider.count(query_str, start_date, end_date, **provider_props)
        if count > 100000 and not request.user.is_staff:  # arbitrary limit for now
            return HttpResponseBadRequest("Too many matches to download, make sure there are < 100,000")
        elif count > 500000 and request.user.is_staff:
            return HttpResponseBadRequest("Too many matches to download, make sure there are < 500,000")
    except UnsupportedOperationException:
        logger.warning("Can't count results for download in {}... continuing anyway".format(provider_name))
    # we want to stream the results back to the user row by row (based on paging through results)
    def data_generator():
        first_page = True
        for page in provider.all_items(query_str, start_date, end_date, **provider_props):
            QuotaHistory.increment(request.user.id, request.user.is_staff, provider_name)
            if first_page:  # send back column names, which differ by platform
                yield sorted(list(page[0].keys()))
            for story in page:
                ordered_story = collections.OrderedDict(sorted(story.items()))
                yield [v for k, v in ordered_story.items()]
            first_page = False

    filename = "mc-{}-{}-content.csv".format(provider_name, _filename_timestamp())
    streamer = csv_stream.CSVStream(filename, data_generator)
    return streamer.stream()


def _filename_timestamp() -> str:
    return time.strftime("%Y%m%d%H%M%S", time.localtime())
