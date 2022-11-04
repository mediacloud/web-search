import json
import logging
import csv
import time
from operator import itemgetter
import collections as py_collections
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import action
import mcweb.backend.search.platforms as platforms
import mcweb.backend.search.platforms.exceptions
import mcweb.backend.util.csv_stream as csv_stream
from .utils import fill_in_dates, parse_query



logger = logging.getLogger(__name__)

@require_http_methods(["POST"])
def total_count(request):
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)
    total_attention = provider.count(query_str, start_date, end_date, collections=collections)
    # everything_count = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"count": total_attention}), content_type="application/json", status=200)

@require_http_methods(["POST"])
def count_over_time(request):
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)
    count_attention_over_time = provider.count_over_time(query_str, start_date, end_date, collections=collections)
    zero_filled_counts = fill_in_dates(start_date, end_date, count_attention_over_time['counts'])
    count_attention_over_time['counts'] = zero_filled_counts
    return HttpResponse(json.dumps({"count_over_time": count_attention_over_time }, default=str), content_type="application/json", status=200)

@require_http_methods(["POST"])
def sample(request):
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)
    sample_stories = provider.sample(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"sample": sample_stories }, default=str), content_type="application/json", status=200)

@require_http_methods(["POST"])
def normalized_count_over_time(request):
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)
    logger.debug("NORMALIZED COUNT OVER TIME: %, %".format(start_date, end_date))
    counts_data = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"normalized_count_over_time": counts_data }, default=str), content_type="application/json", status=200)

logger = logging.getLogger(__name__)

@require_http_methods(["POST"])
@action(detail=False)
def download_counts_over_time_csv(request):
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)
    try:
        counts_data = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    except mcweb.backend.search.platforms.exceptions.UnsupportedOperationException:
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
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)

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
    filename = "mc-{}-{}-{}.csv".format(platform, platform_source, filename_timestamp)
    streamer = csv_stream.CSVStream(filename, data_generator)
    return streamer.stream()
