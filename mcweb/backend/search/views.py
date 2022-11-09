import json
import logging
import csv
import time
import collections as py_collections
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import action

import backend.search.providers as providers
import backend.search.providers.exceptions
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
    total_attention = provider.count(query_str, start_date, end_date, collections=collections)
    # everything_count = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"count": total_attention}), content_type="application/json", status=200)


@handle_provider_errors
@require_http_methods(["POST"])
def count_over_time(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    count_attention_over_time = provider.count_over_time(query_str, start_date, end_date, collections=collections)
    zero_filled_counts = fill_in_dates(start_date, end_date, count_attention_over_time['counts'])
    count_attention_over_time['counts'] = zero_filled_counts
    return HttpResponse(json.dumps({"count_over_time": count_attention_over_time}, default=str), content_type="application/json", status=200)


@handle_provider_errors
@require_http_methods(["POST"])
def sample(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    sample_stories = provider.sample(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"sample": sample_stories }, default=str), content_type="application/json", status=200)

@require_http_methods(["POST"])
def normalized_count_over_time(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    logger.debug("NORMALIZED COUNT OVER TIME: %, %".format(start_date, end_date))
    counts_data = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"count_over_time": counts_data }, default=str), content_type="application/json", status=200)

@require_http_methods(["POST"])
@action(detail=False)
def download_counts_over_time_csv(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)
    try:
        counts_data = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    except mcweb.backend.search.providers.exceptions.UnsupportedOperationException:
        counts_data = provider.count_over_time(query_str, start_date, end_date, collections=collections)
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="somefilename.csv"'},
    )
    writer = csv.writer(response)
    # extract into a constat (global)
    writer.writerow(['date', 'count', 'total_count', 'ratio'])
    for day in counts_data["counts"]:
        if 'ratio' in day:
            writer.writerow([day["date"], day["count"], day["total_count"], day["ratio"]])
        else:
            writer.writerow([day["date"], day["count"]])
    return response


@require_http_methods(["POST"])
@action(detail=False)
def download_all_content_csv(request):
    start_date, end_date, query_str, collections, provider_name = parse_query(request)
    provider = providers.provider_by_name(provider_name)

    # don't allow gigantic downloads
    count = provider.count(query_str, start_date, end_date, collections=collections)
    if count > 100000:  # arbitrary limit for now
        return HttpResponseBadRequest("Too many matches to download, make sure there are < 100,000")

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

    filename_timestamp = time.strftime("%Y%m%d%H%M%S", time.localtime())
    filename = "mc-{}-{}.csv".format(provider_name, filename_timestamp)
    streamer = csv_stream.CSVStream(filename, data_generator)
    return streamer.stream()
