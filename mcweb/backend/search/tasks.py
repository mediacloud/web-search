"""
Background tasks for 'download_all_content_csv'
"""

from ..users.models import QuotaHistory
from .utils import parse_query
import logging
import collections
import logging
import time
from io import StringIO, BytesIO
import zipfile
import csv
from background_task import background
from ..sources.tasks import _return_task
from util.send_emails import send_zipped_large_download_email


import mc_providers as providers
import csv


logger = logging.getLogger(__name__)


def download_all_large_content_csv(queryState, user_id, user_isStaff, email):
    task = _download_all_large_content_csv(
        queryState, user_id, user_isStaff, email)
    return {'task': _return_task(task)}

@background(remove_existing_tasks=True)
def _download_all_large_content_csv(queryState, user_id, user_isStaff, email):
    data = []
    for query in queryState:
        start_date, end_date, query_str, provider_props, provider_name = parse_query(
            query, 'GET')
        provider = providers.provider_by_name(provider_name)
        data.append(provider.all_items(
            query_str, start_date, end_date, **provider_props))

    # iterator function
    def data_generator():
        for result in data:
            first_page = True
            for page in result:
                QuotaHistory.increment(user_id, user_isStaff, provider_name)
                if first_page:  # send back column names, which differ by platform
                    yield sorted(list(page[0].keys()))
                for story in page:
                    ordered_story = collections.OrderedDict(
                        sorted(story.items()))
                    yield [v for k, v in ordered_story.items()]
                first_page = False

    # code from: https://stackoverflow.com/questions/17584550/attach-generated-csv-file-to-email-and-send-with-django
    
    # Create an in-memory byte stream
    zipstream = BytesIO()

    # Create a ZipFile object using the in-memory byte stream
    zipfile_obj = zipfile.ZipFile(zipstream, 'w', zipfile.ZIP_DEFLATED)

    # Create a StringIO object to store the CSV data
    csvfile = StringIO()
    csvwriter = csv.writer(csvfile)
    
   
    zip_filename = "mc-{}-{}-content.gz".format(
        provider_name, _filename_timestamp())
    
    # Generate and write data to the CSV
    for data in data_generator():
        csvwriter.writerow(data)
   
    # Convert the CSV data from StringIO to bytes
    csv_data = csvfile.getvalue()
    # Add the CSV data to the zip file
    zipfile_obj.writestr(zip_filename, csv_data)
    # Close the zip file
    zipfile_obj.close()
    # Get the zip data
    zipped_data = zipstream.getvalue()

    logger.info("Sent Email")

    send_zipped_large_download_email(zip_filename, zipped_data, email)


def _filename_timestamp() -> str:
    return time.strftime("%Y%m%d%H%M%S", time.localtime())
