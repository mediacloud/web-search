import json
import logging
import csv
from operator import itemgetter
import datetime as dt
import time
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import action
import collections as py_collections

import mcweb.backend.search.platforms as platforms
import mcweb.backend.search.platforms.exceptions
import mcweb.backend.util.csv_stream as csv_stream


logger = logging.getLogger(__name__)


def parse_query(request) -> tuple:
    # single point for parsing query args off the request object
    payload = json.loads(request.body)
    payload = payload.get("queryObject")
    platform = payload["platform"]
    query = payload["query"]
    collections = payload["collections"]
    sources = payload["sources"]
    start_date = payload["startDate"]
    start_date = dt.datetime.strptime(start_date, '%m/%d/%Y')
    end_date = payload["endDate"]
    end_date = dt.datetime.strptime(end_date, '%m/%d/%Y')
    if platform == "onlinenews":
        platform = {"platform": platforms.PLATFORM_ONLINE_NEWS, "platform_source": platforms.PLATFORM_SOURCE_MEDIA_CLOUD }
    elif platform == "twitter":
        platform = {"platform": platforms.PLATFORM_TWITTER, "platform_source": platforms.PLATFORM_SOURCE_TWITTER }
    elif platform == "reddit":
        platform = {"platform": platforms.PLATFORM_REDDIT, "platform_source": platforms.PLATFORM_SOURCE_PUSHSHIFT }
    elif platform == "youtube":
        platform = {"platform": platforms.PLATFORM_YOUTUBE, "platform_source": platforms.PLATFORM_SOURCE_YOUTUBE }
    platform, platform_source = itemgetter("platform", "platform_source")(platform)
    return start_date, end_date, query, collections, platform, platform_source


@require_http_methods(["POST"])
def total_count(request):
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)
    count = provider.count(query_str, start_date, end_date, collections=collections)
    # everything_count = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"count": count}), content_type="application/json", status=200)


@require_http_methods(["POST"])
def count_over_time(request):
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)
    logger.debug("COUNT OVER TIME: %, %".format(start_date, end_date))
    counts_data = provider.count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"count_over_time": counts_data }, default=str), content_type="application/json", status=200)

@require_http_methods(["POST"])
def normalized_count_over_time(request):
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)
    logger.debug("NORMALIZED COUNT OVER TIME: %, %".format(start_date, end_date))
    counts_data = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"normalized_count_over_time": counts_data }, default=str), content_type="application/json", status=200)

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
def sample(request):
    start_date, end_date, query_str, collections, platform, platform_source = parse_query(request)
    provider = platforms.provider_for(platform, platform_source)
    sample = provider.sample(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"sample": sample }, default=str), content_type="application/json", status=200)


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
