import datetime
from operator import itemgetter
import dateutil
import mediacloud.api


def _trim_solr_date(date_str):
    return dateutil.parser.parse(date_str).strftime("%Y-%m-%d")


def add_missing_dates_to_split_story_counts(counts, start, end, period="day"):
    if start is None and end is None:
        return counts
    new_counts = []
    current = start.date()
    while current <= end.date():
        date_string = current.strftime(mediacloud.api.MediaCloud.SENTENCE_PUBLISH_DATE_FORMAT)
        existing_count = next((r for r in counts if r['date'] == date_string), None)
        if existing_count:
            new_counts.append(existing_count)
        else:
            new_counts.append({'date': date_string, 'count': 0})
        if period == "day":
            current += datetime.timedelta(days=1)
        elif period == "month":
            current += datetime.timedelta(days=30)
        elif period == "year":
            current += datetime.timedelta(days=365)
        else:
            raise RuntimeError("Unsupport time period for filling in missing dates - {}".format(period))
    return new_counts


def combined_split_and_normalized_counts(matching_results, total_results):
    counts = []
    for day in total_results:
        day_info = {
            'date': day['date'],
            'total_count': day['count']
        }
        matching = [d for d in matching_results if d['date'] == day['date']]
        if len(matching) == 0:
            day_info['count'] = 0
        else:
            day_info['count'] = matching[0]['count']
        if day_info['count'] == 0 or day['count'] == 0:
            day_info['ratio'] = 0
        else:
            day_info['ratio'] = float(day_info['count']) / float(day['count'])
        counts.append(day_info)
    counts = sorted(counts, key=itemgetter('date'))
    return counts
