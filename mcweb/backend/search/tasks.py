"""
Background tasks for 'download_all_content_csv'
"""

from ..users.models import QuotaHistory
from .utils import parse_query
import datetime as dt
import logging
import collections
import logging
import time
import backend.util.csv_stream as csv_stream
from background_task import background
from ..sources.tasks import _return_task
from django.http import HttpResponse, HttpResponseBadRequest


# emails
from util.send_emails import send_alert_email

import mc_providers as providers


logger = logging.getLogger(__name__)


def download_all_large_content_csv(queryState, count, user_id, user_isStaff):
    print("queryState: " + str(queryState))
    print("count: " + str(count))
    print("user_id: " + str(user_id))
    print("user_isStaff: " + str(user_isStaff))
    if count > 100000:
        _download_all_large_content_csv(queryState, user_id, user_isStaff)
        # return {'task': _return_task(task)}

@background()
def _download_all_large_content_csv(queryState, user_id, user_isStaff):
    data = []
    for query in queryState:
        start_date, end_date, query_str, provider_props, provider_name = parse_query(
            query, 'GET')
        provider = providers.provider_by_name(provider_name)
        data.append(provider.all_items(query_str, start_date, end_date, **provider_props))
    
    def data_generator():
        for result in data:
            first_page = True
            for page in result:
                QuotaHistory.increment(
                    user_id, user_isStaff, provider_name)
                if first_page:  # send back column names, which differ by platform
                    yield sorted(list(page[0].keys()))
                for story in page:
                    ordered_story = collections.OrderedDict(
                        sorted(story.items()))
                    yield [v for k, v in ordered_story.items()]
                first_page = False

    filename = "mc-{}-{}-content.csv".format(provider_name, _filename_timestamp())
    
    streamer = csv_stream.CSVStream(filename, data_generator)
    return streamer.stream()

def _filename_timestamp() -> str:
    return time.strftime("%Y%m%d%H%M%S", time.localtime())
