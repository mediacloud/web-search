import datetime as dt
import json


def fill_in_dates(start_date, end_date, existing_counts):
    delta = (end_date + dt.timedelta(1)) - start_date
    date_count_dict = {k['date']: k['count'] for k in existing_counts}

    # whether or not the dates in existing_counts are string types
    dates_as_strings = (len(date_count_dict.keys()) == 0) or (isinstance(next(iter(date_count_dict.keys())), str))
    if not dates_as_strings:
        date_count_dict = {dt.datetime.strftime(k, "%Y-%m-%d %H:%M:%S"): v for k, v in date_count_dict.items()}

    filled_counts = []
    for i in range(delta.days):
        day = start_date + dt.timedelta(days=i)
        day_string = dt.datetime.strftime(day, "%Y-%m-%d %H:%M:%S")
        if day_string not in date_count_dict.keys():
            filled_counts.append({"count": 0, "date": day_string})
        else:
            filled_counts.append({'count': date_count_dict[day_string], 'date': day_string})
    return filled_counts


def parse_query(request, http_method: str = 'POST') -> tuple:
    payload = json.loads(request.body).get("queryObject") if http_method == 'POST' else json.loads(request.GET.get("queryObject"))
    provider_name = payload["platform"]
    query_str = payload["query"]
    collections = payload["collections"]
    sources = payload["sources"]
    start_date = payload["startDate"]
    start_date = dt.datetime.strptime(start_date, '%m/%d/%Y')
    end_date = payload["endDate"]
    end_date = dt.datetime.strptime(end_date, '%m/%d/%Y')
    return start_date, end_date, query_str, collections, provider_name
