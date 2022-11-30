import json
import logging
import csv
import time
import collections as py_collections
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import action

import backend.search.providers as providers
from backend.search.providers.exceptions import UnsupportedOperationException, QueryingEverythingUnsupportedQuery
import backend.util.csv_stream as csv_stream
from .utils import fill_in_dates, parse_query

logger = logging.getLogger(__name__)


def handle_provider_errors(func):
    """
    If a provider-related method returns a JSON error we want to send it back to the client with information
    that can be used to show the user some kind of error.
    """
    def _handler(request):
        try:
            return func(request)
        except Exception as e:
            return HttpResponseBadRequest(json.dumps(dict(
               status="error",
               note=str(e),
            )))
    return _handler


@handle_provider_errors
@require_http_methods(["POST"])
def total_count(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    relevant_count = provider.count(query_str, start_date, end_date, collections=collections)
    try:
        total_content_count = provider.count(provider.everything_query(), start_date, end_date, collections=collections)
    except QueryingEverythingUnsupportedQuery as e:
        total_content_count = None
    # everything_count = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"count": {"relevant": relevant_count, "total": total_content_count}}),
                        content_type="application/json", status=200)


@handle_provider_errors
@require_http_methods(["POST"])
def count_over_time(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    try:
        results = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    except UnsupportedOperationException:
        # for platforms that don't support querying over time
        results = provider.count_over_time(query_str, start_date, end_date, collections=collections)
    #logger.debug("NORMALIZED COUNT OVER TIME: %, %".format(start_date, end_date))
    return HttpResponse(json.dumps({"count_over_time": results}, default=str), content_type="application/json",
                        status=200)


@handle_provider_errors
@require_http_methods(["POST"])
def sample(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    sample_stories = provider.sample(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"sample": sample_stories }, default=str), content_type="application/json",
                        status=200)


@require_http_methods(["GET"])
@action(detail=False)
def download_counts_over_time_csv(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request, 'GET')
    provider = providers.provider_by_name(provider_name)
    try:
        counts_data = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
        normalized = True
    except UnsupportedOperationException:
        counts_data = provider.count_over_time(query_str, start_date, end_date, collections=collections)
        normalized = False
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


@require_http_methods(["GET"])
@action(detail=False)
def download_all_content_csv(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request, 'GET')
    provider = providers.provider_by_name(provider_name)
    # don't allow gigantic downloads
    count = provider.count(query_str, start_date, end_date, collections=collections)
    if count > 100000 and not request.user.is_staff:  # arbitrary limit for now
        return HttpResponseBadRequest("Too many matches to download, make sure there are < 100,000")
    elif count > 500000 and request.user.is_staff:
        return HttpResponseBadRequest("Too many matches to download, make sure there are < 500,000")

    # we want to stream the results back to the user row by row (based on paging through results)
    def data_generator():
        first_page = True
        for page in provider.all_items(query_str, start_date, end_date, collections=collections):
            if first_page:  # send back columun names, which differ by platform
                yield sorted(list(page[0].keys()))
            for story in page:
                ordered_story = py_collections.OrderedDict(sorted(story.items()))
                yield [v for k, v in ordered_story.items()]
            first_page = False

    filename = "mc-{}-{}-content.csv".format(provider_name, _filename_timestamp())
    streamer = csv_stream.CSVStream(filename, data_generator)
    return streamer.stream()


def _filename_timestamp() -> str:
    return time.strftime("%Y%m%d%H%M%S", time.localtime())
