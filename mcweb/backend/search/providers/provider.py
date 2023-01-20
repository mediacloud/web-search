import logging
from typing import List, Dict
import datetime as dt
import datetime
from operator import itemgetter
from abc import ABC
import collections
from .exceptions import QueryingEverythingUnsupportedQuery
from .language import terms_without_stopwords

# helpful for turning any date into the standard Media Cloud date format
MC_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

DEFAULT_WORDS_SAMPLE = 500
DEFAULT_LANGUAGE_SAMPLE = 1000


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

    def languages(self, query: str, start_date: dt.datetime, end_date: dt.datetime, **kwargs) -> List[Dict]:
        raise NotImplementedError("Doesn't support top languages.")

    def sources(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
                **kwargs) -> List[Dict]:
        raise NotImplementedError("Doesn't support top sources.")

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

    # use this if you need to sample some content for top languages
    def _sampled_languages(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 10,
                               **kwargs) -> List[Dict]:
        # support sample_size kwarg
        sample_size = kwargs['sample_size'] if 'sample_size' in kwargs else DEFAULT_LANGUAGE_SAMPLE
        # grab a sample and count terms as we page through it
        sampled_count = 0
        counts = collections.Counter()
        for page in self.all_items(query, start_date, end_date, limit=sample_size):
            sampled_count += len(page)
            [counts.update(t['language'] for t in page)]
        # clean up results
        results = [dict(language=w, count=c, ratio=c/sampled_count) for w, c in counts.most_common()]
        return results[:limit]

    # use this if you need to sample some content for top words
    def _sampled_title_words(self, query: str, start_date: dt.datetime, end_date: dt.datetime, limit: int = 100,
                             **kwargs) -> List[Dict]:
        # support sample_size kwarg
        sample_size = kwargs['sample_size'] if 'sample_size' in kwargs else DEFAULT_WORDS_SAMPLE
        # grab a sample and count terms as we page through it
        sampled_count = 0
        counts = collections.Counter()
        for page in self.all_items(query, start_date, end_date, limit=sample_size):
            sampled_count += len(page)
            [counts.update(terms_without_stopwords(t['language'], t['title'])) for t in page]
        # clean up results
        results = [dict(term=w, count=c, ratio=c/sampled_count) for w, c in counts.most_common(limit)]
        return results


def add_missing_dates_to_split_story_counts(counts, start, end, period="day"):
    if start is None and end is None:
        return counts
    new_counts = []
    current = start.date()
    while current <= end.date():
        date_string = current.strftime("%Y-%m-%d %H:%M:%S")
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
