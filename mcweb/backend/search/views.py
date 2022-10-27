from itertools import count
import json
import logging
import csv
from operator import countOf, itemgetter
import datetime as dt
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import action
from .platforms import provider_for, PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD, PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT, PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER, PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE, PLATFORM_SOURCE_WAYBACK_MACHINE




logger = logging.getLogger(__name__)


# search tool
@require_http_methods(["POST"])
def search(request):

    payload = json.loads(request.body)
  
    query_str = payload.get('query', None)
  
    logger.debug(len(query_str))
  
    start_date = payload.get('start', None)
    start_date = dt.datetime.strptime(start_date, '%m/%d/%Y')
  
    end_date = payload.get('end', None)
    end_date = dt.datetime.strptime(end_date, '%m/%d/%Y')
  
    provider = provider_for(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD)
    total_articles = provider.count(query_str, start_date, end_date)
   
    return HttpResponse(json.dumps({"count": total_articles}), content_type="application/json", status=200)

@require_http_methods(["POST"])
def query(request):
    payload = json.loads(request.body)
    payload = payload.get("queryObject")
    platform = payload["platform"]
    query_str = payload["query"]
    collections = payload["collections"]
    sources = payload["sources"]
    #parsequery()
    start_date = payload["startDate"]
    start_date = dt.datetime.strptime(start_date, '%m/%d/%Y')
    end_date = payload["endDate"]
    end_date = dt.datetime.strptime(end_date, '%m/%d/%Y')
    # total attention
        # start date, enddate, query, collections= parsed query
        #provider = provider for (platform)
        #total attention = provider.counts
    # attention over time
        # same but count over time is returned
    if platform == 'Online News Archive':
        provider = provider_for(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD)
        total_articles = provider.count(query_str, start_date, end_date, collections=collections)
        sample = provider.sample(query_str, start_date, end_date, collections=collections)
        count_over_time = provider.count_over_time(query_str, start_date, end_date, collections=collections)
        words = provider.words(query_str, start_date, end_date, collections=collections)
        return HttpResponse(json.dumps({"count": total_articles, "count_over_time": count_over_time, "sample":sample, "words": words  }), content_type="application/json", status=200)
    
    elif platform == "Twitter":
        twitter_provider = provider_for(PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER)
        total_articles = twitter_provider.count(query_str, start_date, end_date)
        sample = twitter_provider.sample(query_str, start_date, end_date) # Need to normalize dates
        print(sample)
        count_over_time = twitter_provider.count_over_time(query_str, start_date, end_date) # need to normalize dates for return
        print(count_over_time)
        return HttpResponse(json.dumps({"count": total_articles, "sample": sample, "count_over_time":count_over_time }, default=str), content_type="application/json", status=200)
    
    elif platform == 'Youtube':
        youtube_provider = provider_for(PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE)
        total_articles = youtube_provider.count(query_str, start_date, end_date)
        sample = youtube_provider.sample(query_str, start_date, end_date)
        print("TOTAL ARTICLES",total_articles)
        print("SAMPLES", sample)
         # print(query_str, platform, start_date, end_date, payload)
        return HttpResponse(json.dumps({"count": total_articles, "sample":sample }), content_type="application/json", status=200)

    elif platform == "Reddit":
        reddit_provider = provider_for(PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT)
        total_articles = reddit_provider.count(query_str, start_date, end_date)
        sample = reddit_provider.sample(query_str, start_date, end_date)
        count_over_time = reddit_provider.count_over_time(query_str, start_date, end_date)
         # print("COUNT OVER TIME", len(count_over_time['counts']))
         # print("TOTAL ARTICLES",total_articles)
         # print("SAMPLES", sample)
         # print(query_str, platform, start_date, end_date, payload)
        return HttpResponse(json.dumps({"count": total_articles }), content_type="application/json", status=200)

    else:
        return HttpResponse(json.dumps({"errors": "Platform not recognized"}), content_type="application/json", status=400)


def parse_query(request):
    payload = json.loads(request.body)
    payload = payload.get("queryObject")
    platform = payload["platform"]
    query_str = payload["query"]
    collections = payload["collections"]
    sources = payload["sources"]
    start_date = payload["startDate"]
    start_date = dt.datetime.strptime(start_date, '%m/%d/%Y')
    end_date = payload["endDate"]
    end_date = dt.datetime.strptime(end_date, '%m/%d/%Y')
    if platform == "onlinenews":
        platform = {"platform": PLATFORM_ONLINE_NEWS, "platform_source": PLATFORM_SOURCE_MEDIA_CLOUD }
    elif platform == "twitter":
        platform = {"platform": PLATFORM_TWITTER, "platform_source": PLATFORM_SOURCE_TWITTER }
    elif platform == "reddit":
        platform = {"platform": PLATFORM_REDDIT, "platform_source": PLATFORM_SOURCE_PUSHSHIFT }
    elif platform == "youtube":
        platform = {"platform": PLATFORM_YOUTUBE, "platform_source": PLATFORM_SOURCE_YOUTUBE }
    platform, platform_source = itemgetter("platform", "platform_source")(platform)
    return ({"start_date": start_date, "end_date": end_date, "query": query_str, "collections":collections, "platform":platform, "platform_source": platform_source})

@require_http_methods(["POST"])
def total_count(request):
    start_date, end_date, query_str, collections, platform, platform_source = itemgetter("start_date", "end_date", "query", "collections", "platform", "platform_source")(parse_query(request))
    provider = provider_for(platform, platform_source)
    count = provider.count(query_str, start_date, end_date, collections=collections)
    # everything_count = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"count": count }), content_type="application/json", status=200)

@require_http_methods(["POST"])
def count_over_time(request):
    start_date, end_date, query_str, collections, platform, platform_source = itemgetter("start_date", "end_date", "query", "collections", "platform", "platform_source")(parse_query(request))
    provider = provider_for(platform, platform_source)
    print("COUNT OVER TIME", start_date, end_date)
    count_over_time = provider.count_over_time(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"count_over_time": count_over_time }, default=str), content_type="application/json", status=200)

@require_http_methods(["POST"])
def sample(request):
    start_date, end_date, query_str, collections, platform, platform_source = itemgetter("start_date", "end_date", "query", "collections", "platform", "platform_source")(parse_query(request))
    provider = provider_for(platform, platform_source)
    sample = provider.sample(query_str, start_date, end_date, collections=collections)
    return HttpResponse(json.dumps({"sample": sample }, default=str), content_type="application/json", status=200)


@require_http_methods(["POST"])
@action(detail=False)
def download_counts_over_time_csv(request):

    start_date, end_date, query_str, collections, platform, platform_source = itemgetter("start_date", "end_date", "query", "collections", "platform", "platform_source")(parse_query(request))
    provider = provider_for(platform, platform_source)
    count_over_time = provider.normalized_count_over_time(query_str, start_date, end_date, collections=collections)

    response = HttpResponse(
    content_type='text/csv',
    headers={'Content-Disposition': 'attachment; filename="somefilename.csv"'},
    )

    writer = csv.writer(response)

    # extract into a constat (global)
    writer.writerow(['date', 'count', 'total_count', 'ratio'])

    for day in count_over_time["counts"]:
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