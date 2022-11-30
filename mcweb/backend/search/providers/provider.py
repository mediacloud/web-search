import logging
from typing import List, Dict
import datetime as dt
import datetime
from operator import itemgetter
from abc import ABC
import mediacloud.api
from .exceptions import QueryingEverythingUnsupportedQuery

# helpful for turning any date into the standard Media Cloud date format
MC_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


class ContentProvider(ABC):
    """
    An abstract wrapper to be implemented for each platform we want to preview content from.
    Any unimplemented methods raise an Exception
    """

    def __init__(self):
        self._logger = logging.getLogger(__name__)

    def everything_query(self) -> str:
        raise QueryingEverythingUnsupportedQuery()

    def sample(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 20,
               **kwargs) -> List[Dict]:
        raise NotImplementedError("Doesn't support sample content.")

    def count(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> int:
        raise NotImplementedError("Doesn't support total count.")

    def count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> Dict:
        raise NotImplementedError("Doesn't support counts over time.")

    def item(self, item_id: str) -> Dict:
        raise NotImplementedError("Doesn't support fetching individual content.")

    def words(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
              **kwargs) -> List[Dict]:
        raise NotImplementedError("Doesn't support top words.")

    def all_items(self, query: str, start_date: dt.datetime, end_date: dt.datetime, page_size: int = 1000,
                  **kwargs):
        # yields a page of items
        raise NotImplementedError("Doesn't support fetching all matching content.")

    def normalized_count_over_time(self, query: str, start_date: dt.datetime, end_date: dt.datetime,
                                   **kwargs) -> Dict:
        """
        Useful for rendering attention-over-time charts with extra information suitable for normalizing
        :param query:
        :param start_date:
        :param end_date:
        :param kwargs:
        :return:
        """
        matching_content_counts = self.count_over_time(query, start_date, end_date, **kwargs)['counts']
        matching_total = sum([d['count'] for d in matching_content_counts])
        no_query_content_counts = self.count_over_time(self._everything_query(), start_date, end_date,
                                                       **kwargs)['counts']
        no_query_total = sum([d['count'] for d in no_query_content_counts])
        return {
            'counts': _combined_split_and_normalized_counts(matching_content_counts, no_query_content_counts),
            'total': matching_total,
            'normalized_total': no_query_total,
        }

    def _everything_query(self) -> str:
        """
        :return: a query string that can be used to capture matching "everything" 
        """
        return '*'


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
            current += datetime.timedelta(days=31)
        elif period == "year":
            current += datetime.timedelta(days=365)
        else:
            raise RuntimeError("Unsupport time period for filling in missing dates - {}".format(period))
    return new_counts


def _combined_split_and_normalized_counts(matching_results, total_results):
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
