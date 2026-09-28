"""
Background tasks for 'download_all_content_csv'
"""

# Python
import csv
import datetime as dt
import logging
import os
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

# mcweb
from settings import EMAIL_HOST

logger = logging.getLogger(__name__)


# called from /api/search/send-email-large-download-csv endpoint
# by frontend sendTotalAttentionDataEmail
def download_all_large_content_csv(queryState: list[dict], user_id: int, user_isStaff: bool, email: str):
    task = _download_all_large_content_csv(queryState, user_id, user_isStaff, email)
    return {'task': return_task(task)}  # XXX double wraps {task: {task: TASK_DATA}}??

def str_or_none(value):
    if value is None:
        return ""               # line will be omitted
    return value

def int_list(value):
    """format list of src/collection id ints"""
    if value:
        return ",".join(str(x) for x in value)
    return "None"

DESCR_ITEMS = [
    # queryState item, description, formatter
    # see https://github.com/mediacloud/web-search/issues/1337
    ("query", "Search phrases", str_or_none),
    ("startDate", "Start date", str_or_none),  # MM/DD/YYYY
    ("endDate", "End date", str_or_none),  # MM/DD/YYYY
    ("collections", "Collections", int_list),
    ("sources", "Sources", int_list)
]

@background(queue=USER_SLOW, remove_existing_tasks=True)
def _download_all_large_content_csv(queryState: list[dict], user_id: int, is_staff: bool, email: str):
    if not EMAIL_HOST:
        logger.info("large_content_csv for %s; %d query/ies: EMAIL_HOST not set")
        return

    # maybe put the rest in a helper, and wrap in a try, sending email on failure?

    parsed_queries = [parsed_query_from_dict(q, session_id=email) for q in queryState]
    # code from: https://stackoverflow.com/questions/17584550/attach-generated-csv-file-to-email-and-send-with-django

    logger.info("starting large_content_csv for %s; %d query/ies",
                email, len(parsed_queries))

    basename = all_content_csv_basename(parsed_queries)

    # always make matching filenames
    csv_filename = basename + ".csv"
    zip_filename = basename + ".zip"
    descr_filename = basename + ".txt"

    # check quotas still not exhausted up front
    # (counts would help ensure the fetch will complete)
    # There SHOULD only be a single parsed query!
    for pq in parsed_queries:
        QuotaHistory.check_quota(user_id, is_staff, pq.provider_name)

    # collect description used as body of email AND descr_file inside ZIP;
    # see https://github.com/mediacloud/web-search/issues/1337
    descr_lines = [
        f"Attached is {csv_filename} with all stories matching your query:\n"
    ]

    # loop thru raw queryState (instead of ParsedQuery) for raw source
    # and collection ids.  SHOULD only have one query.
    for qs in queryState:
        for key, text, formatter in DESCR_ITEMS:
            tmp = formatter(qs.get(key))
            if tmp:
                descr_lines.append(f"{text}: {tmp}\n")

    # concatenate lines with extra newline for double spacing
    description = "\n".join(descr_lines) + "\n"

    # Create an in-memory byte stream, and wrap ZipFile object around it
    zipstream = BytesIO()
    zipfile_obj = zipfile.ZipFile(zipstream, 'w', zipfile.ZIP_DEFLATED)

    # include query description in the ZIP file as as UNIQUENAME.txt
    # so information present after unzipping.
    zipfile_obj.writestr(descr_filename, description)

    # 250000 URLs in pages of 1000 at 120/minute is 2 minutes
    data_generator = all_content_csv_generator(parsed_queries, user_id, is_staff, delay=0.5)

    # write uncompressed CSV to a temp file to avoid swelling VM footprint
    # of web worker processes
    tmp_csv = f"/var/tmp/{csv_filename}"
    try:
        with open(tmp_csv, "w") as csvfile:
            csvwriter = csv.writer(csvfile)

            # Generate and write data to the CSV
            csvwriter.writerows(data_generator())

        # Add the CSV file to the ZIP file
        zipfile_obj.write(tmp_csv, arcname=csv_filename)
    finally:
        if os.path.exists(csv_filename):
            os.unlink(csv_filename)

    # Close the zip file
    zipfile_obj.close()

    # Get the zip data
    zipped_data = zipstream.getvalue()

    send_zipped_large_download_email(zip_filename, zipped_data, email, description)


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
    # to check that this is dead code:
    logger.error("_download_all_queries_csv called!!!!!")

    # check quotas still not exhausted up front
    # (counts would help ensure the fetch will complete)
    for pq in data:
        QuotaHistory.check_quota(user_id, is_staff, pq.provider_name)

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
