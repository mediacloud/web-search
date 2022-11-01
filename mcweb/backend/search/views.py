import json
import logging
import csv
from operator import itemgetter
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import action
from .platforms import provider_for, PLATFORM_SOURCE_WAYBACK_MACHINE
from .utils import fill_in_dates, parse_query

logger = logging.getLogger(__name__)

@require_http_methods(["POST"])
def total_count(request):
    start_date, end_date, query_str, collections, platform, platform_source = itemgetter("start_date", "end_date", "query", "collections", "platform", "platform_source")(parse_query(request))
    provider = provider_for(platform, platform_source)
    total_attention = provider.count(query_str, start_date, end_date, collections=collections)
    # everything_count = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"count": total_attention}), content_type="application/json", status=200)

@require_http_methods(["POST"])
def count_over_time(request):
    start_date, end_date, query_str, collections, platform, platform_source = itemgetter("start_date", "end_date", "query", "collections", "platform", "platform_source")(parse_query(request))
    provider = provider_for(platform, platform_source)
    count_attention_over_time = provider.count_over_time(query_str, start_date, end_date, collections=collections)
    zero_filled_counts = fill_in_dates(start_date, end_date, count_attention_over_time['counts'])
    count_attention_over_time['counts'] = zero_filled_counts
    return HttpResponse(json.dumps({"count_over_time": count_attention_over_time }, default=str), content_type="application/json", status=200)

@require_http_methods(["POST"])
def sample(request):
    start_date, end_date, query_str, collections, platform, platform_source = itemgetter("start_date", "end_date", "query", "collections", "platform", "platform_source")(parse_query(request))
    provider = provider_for(platform, platform_source)
    sample_stories = provider.sample(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"sample": sample_stories }, default=str), content_type="application/json", status=200)

@require_http_methods(["POST"])
@action(detail=False)
def download_counts_over_time_csv(request):
    start_date, end_date, query_str, collections, platform, platform_source = itemgetter("start_date", "end_date", "query", "collections", "platform", "platform_source")(parse_query(request))
    provider = provider_for(platform, platform_source)
    count_over_time_download = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    response = HttpResponse(
    content_type='text/csv',
    headers={'Content-Disposition': 'attachment; filename="somefilename.csv"'},
    )
    writer = csv.writer(response)
    writer.writerow(['date', 'count', 'total_count', 'ratio'])
    for day in count_over_time_download["counts"]:
        writer.writerow([day["date"], day["count"], day["total_count"], day["ratio"]])
    return response

@require_http_methods(["POST"])
@action(detail=False)
def download_sample_stories_csv(request):
    start_date, end_date, query_str, collections, platform, platform_source = itemgetter("start_date", "end_date", "query", "collections", "platform", "platform_source")(parse_query(request))
    provider = provider_for(platform, PLATFORM_SOURCE_WAYBACK_MACHINE)
    sample_stories = provider.all_items(query_str, start_date, end_date, collections=collections)
    response = HttpResponse(
    content_type='text/csv',
    headers={'Content-Disposition': 'attachment; filename="somefilename.csv"'},
    )
    writer = csv.writer(response)
    writer.writerow(['publish_date', 'title', 'url', 'language'])
    for row in sample_stories:
        for story in row:
        # Can search media_id (source_id) and source object from story["domain"]
            writer.writerow([story["publication_date"], story["title"], story["url"], story["language"] ])
    return response