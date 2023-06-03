"""
Background tasks for 'download_all_content_csv'
"""

from ..users.models import QuotaHistory
from .utils import parse_query
import logging
import collections
import logging
import gzip
import shutil
import time
from io import StringIO, BytesIO
import csv
from background_task import background
from ..sources.tasks import _return_task
from util.send_emails import send_large_download_csv_email

# emails
from util.send_emails import send_alert_email

import mc_providers as providers
import csv


logger = logging.getLogger(__name__)


def download_all_large_content_csv(queryState, user_id, user_isStaff, email):
    task = _download_all_large_content_csv(queryState, user_id, user_isStaff, email)
    return {'task': _return_task(task)}

@background(remove_existing_tasks=True)
def _download_all_large_content_csv(queryState, user_id, user_isStaff, email):
    data = []
    for query in queryState:
        start_date, end_date, query_str, provider_props, provider_name = parse_query(query, 'GET')
        provider = providers.provider_by_name(provider_name)
        data.append(provider.all_items(query_str, start_date, end_date, **provider_props))
    
    # iterator function
    def data_generator():
        for result in data:
            first_page = True
            for page in result:
                QuotaHistory.increment(user_id, user_isStaff, provider_name)
                if first_page:  # send back column names, which differ by platform
                    yield sorted(list(page[0].keys()))
                for story in page:
                    ordered_story = collections.OrderedDict(sorted(story.items()))
                    yield [v for k, v in ordered_story.items()]
                first_page = False


    # code from: https://stackoverflow.com/questions/17584550/attach-generated-csv-file-to-email-and-send-with-django
    csvfile = StringIO()
    csvwriter = csv.writer(csvfile)
    filename = "mc-{}-{}-content.csv".format(provider_name, _filename_timestamp())
   
    for data in data_generator():
        csvwriter.writerow(data)

    logger.info("Sent CSV Email")
    send_large_download_csv_email(filename, csvfile, email)
    
def _filename_timestamp() -> str:
    return time.strftime("%Y%m%d%H%M%S", time.localtime())
