from itertools import count
import json
import logging
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
import datetime as dt

from .platforms import provider_for, PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD, PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT, PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER, PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE


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
    
    start_date = payload["startDate"]
    start_date = dt.datetime.strptime(start_date, '%m/%d/%Y')
    end_date = payload["endDate"]
    end_date = dt.datetime.strptime(end_date, '%m/%d/%Y')

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
