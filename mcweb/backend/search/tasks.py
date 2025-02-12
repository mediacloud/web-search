"""
Background tasks for 'download_all_content_csv'
"""

# Python
import csv
import datetime as dt
import logging
import zipfile
from io import StringIO, BytesIO

# PyPI
import mc_providers

# mcweb/backend/search (local directory)
from .utils import (
    ParsedQuery,
    all_content_csv_basename,
    all_content_csv_generator,
    filename_timestamp,
    parsed_query_from_dict,
    pq_provider
)

# mcweb/backend
from ..users.models import QuotaHistory
from backend.util.tasks import (
    USER_SLOW,
    background,
    return_task
)

# mcweb/util
from util.send_emails import send_zipped_large_download_email

logger = logging.getLogger(__name__)


# called from /api/search/send-email-large-download-csv endpoint
# by frontend sendTotalAttentionDataEmail
def download_all_large_content_csv(queryState: list[dict], user_id: int, user_isStaff: bool, email: str):
    task = _download_all_large_content_csv(queryState, user_id, user_isStaff, email)
    return {'task': return_task(task)}  # XXX double wraps {task: {task: TASK_DATA}}??

@background(queue=USER_SLOW, remove_existing_tasks=True)
def _download_all_large_content_csv(queryState: list[dict], user_id: int, user_isStaff: bool, email: str):
    parsed_queries = [parsed_query_from_dict(q, session_id=email) for q in queryState]
    # code from: https://stackoverflow.com/questions/17584550/attach-generated-csv-file-to-email-and-send-with-django

    # Phil: maybe catch exception, and send email?

    logger.info("starting large_content_csv for %s; %d query/ies",
                email, len(parsed_queries))

    # if the uncompressed data size is ever an issue
    # (taking too much memory) do:
    # try:
    #    with open("/var/tmp/" + csv_filename, "w") as csvfile:
    #       write to file....
    # and after:
    #    zipfile_obj.write(csv_filename, ....)
    #    send email....
    # finally:
    #    os.unlink(csv_filename)
    # ***OR***
    # switch to gzip (.gz) for compression, which provides
    # a writeable file-like object that can be passed to csv.writer
    # (without storing uncompressed bytes)

    data_generator = all_content_csv_generator(parsed_queries, user_id, user_isStaff)
    basename = all_content_csv_basename(parsed_queries)

    # always make matching filenames
    csv_filename = basename + ".csv"
    zip_filename = basename + ".zip"

    # Create a StringIO object to store the CSV data
    csvfile = StringIO()
    csvwriter = csv.writer(csvfile)

    # Generate and write data to the CSV
    csvwriter.writerows(data_generator())

    # Create an in-memory byte stream, and wrap ZipFile object around it
    zipstream = BytesIO()
    zipfile_obj = zipfile.ZipFile(zipstream, 'w', zipfile.ZIP_DEFLATED)

    # Convert the CSV data from StringIO to bytes
    csv_data = csvfile.getvalue()

    # Add the CSV data to the zip file
    zipfile_obj.writestr(csv_filename, csv_data)

    # Close the zip file
    zipfile_obj.close()

    # Get the zip data
    zipped_data = zipstream.getvalue()

    send_zipped_large_download_email(zip_filename, zipped_data, email)
    logger.info("Sent Email to %s (csv: %d, zip: %d)",
                email, len(csv_data), len(zipped_data))

def download_all_queries_csv_task(data, request):
    task = _download_all_queries_csv(data, request.user.id, request.user.is_staff, request.user.email)
    return {'task': return_task(task)}  # XXX double wraps {task: {task: TASK_DATA}}??

# Phil writes: As I found it, this function used query.thing, which I
# don't think could have worked (was a regular tuple)!  It also (and
# still) only outputs data for the last query, and passes raw "data"
# to csvwriter.writerow *AND* it does a top languages query!
#
# I'm also unconvinced this can be called
# frontend/src/features/search/util/CSVDialog.jsx has:
#   const [downloadAll, { isLoading }] = useDownloadAllQueriesMutation();
# but the call to downloadAll is commented out?

# All of the above makes me think this is dead code!

@background(queue=USER_SLOW, remove_existing_tasks=True)
def _download_all_queries_csv(data: list[ParsedQuery], user_id, is_staff, email):
    for pq in data:
        provider = pq_provider(pq)
        data = provider.languages(f"({pq.query_str})", pq.start_date, pq.end_date, **pq.provider_props)
        QuotaHistory.increment(user_id, is_staff, pq.provider_name)

    # code from: https://stackoverflow.com/questions/17584550/attach-generated-csv-file-to-email-and-send-with-django
    
    # Create an in-memory byte stream
    zipstream = BytesIO()

    # Create a ZipFile object using the in-memory byte stream
    zipfile_obj = zipfile.ZipFile(zipstream, 'w', zipfile.ZIP_DEFLATED)

    # Create a StringIO object to store the CSV data
    csvfile = StringIO()
    csvwriter = csv.writer(csvfile)

    # once, so filenames match up
    prefix = "mc-{}-{}-content".format(pq.provider_name, filename_timestamp())
    csv_filename = f"{prefix}.csv"
    zip_filename = f"{prefix}.zip"

    # Generate and write data to the CSV
    csvwriter.writerow(data)
   
    # Convert the CSV data from StringIO to bytes
    csv_data = csvfile.getvalue()
    # Add the CSV data to the zip file
    zipfile_obj.writestr(csv_filename, csv_data)
    # Close the zip file
    zipfile_obj.close()
    # Get the zip data
    zipped_data = zipstream.getvalue()

    send_zipped_large_download_email(zip_filename, zipped_data, email)
    logger.info("Sent Email to %s (csv: %d, zip: %d)", email, len(csv_data), len(zipped_data))
