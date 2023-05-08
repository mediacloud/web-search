"""
Background tasks for 'download_all_content_csv' 
"""

# standard:
import datetime as dt
import logging
import json
import logging


from util.send_emails import send_alert_email

# PyPI:
from background_task import background
from background_task.models import Task, CompletedTask
from feed_seeker import generate_feed_urls
from mcmetadata.feeds import normalize_url
from django.core.management import call_command
from django.contrib.auth.models import User
from django.utils import timezone
import pandas as pd
import numpy as np


# emails
from util.send_emails import send_alert_email

# rss fetcher

import mc_providers as providers
from mc_providers.exceptions import UnsupportedOperationException, QueryingEverythingUnsupportedQuery
from mc_providers import PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_WAYBACK_MACHINE, PLATFORM_REDDIT
from mc_providers.exceptions import ProviderException
from mc_providers.cache import CachingManager

SCRAPE_TIMEOUT_SECONDS = 120

logger = logging.getLogger(__name__)


def download_all_large_content_csv(provider, queryState):
    print("provider: " + str(provider))
    print("queryState: " + str(queryState))
    # _download_all_large_content_csv(queryState)


@background()
def _download_all_large_content_csv(queryState):
    data = []

    start_date, end_date, query_str, provider_props, provider_name = parse_query(
        query, 'GET')

    provider = providers.provider_by_name(provider_name)

    data.append(provider.all_items(
        query_str, start_date, end_date, **provider_props))

    data.append(provider.all_items(
        query_str, start_date, end_date, **provider_props))

    def data_generator():
        for result in data:
            first_page = True
            for page in result:
                QuotaHistory.increment(
                    request.user.id, request.user.is_staff, provider_name)
                if first_page:  # send back column names, which differ by platform
                    yield sorted(list(page[0].keys()))
                for story in page:
                    ordered_story = collections.OrderedDict(
                        sorted(story.items()))
                    yield [v for k, v in ordered_story.items()]
                first_page = False

    filename = "mc-{}-{}-content.csv".format(
        provider_name, _filename_timestamp())
    streamer = csv_stream.CSVStream(filename, data_generator)
    return streamer.stream()
