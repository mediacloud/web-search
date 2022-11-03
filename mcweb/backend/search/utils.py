import datetime as dt
from operator import itemgetter
import json
from .platforms import PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD, PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT, PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER, PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE, PLATFORM_SOURCE_WAYBACK_MACHINE

def fill_in_dates(start_date, end_date, existing_counts):
    delta = end_date - start_date
    date_count_dict = {k['date']: k['count'] for k in existing_counts}

    # whether or not the dates in existing_counts are string types
    dates_as_strings = (len(date_count_dict.keys()) == 0) or (isinstance(next(iter(date_count_dict.keys())), str))
    if not dates_as_strings:
        date_count_dict = {dt.datetime.strftime(k, "%Y-%m-%d %H:%M:%S"): v for k, v in date_count_dict.items()}

    filled_counts = []
    for i in range(delta.days):
        day = start_date + dt.timedelta(days=i)
        day_string = dt.datetime.strftime(day, "%Y-%m-%d %H:%M:%S")
        if (day_string not in date_count_dict.keys()):
            filled_counts.append({"count": 0, "date": day_string})
        else:
            filled_counts.append({'count': date_count_dict[day_string], 'date': day_string})
    return filled_counts

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