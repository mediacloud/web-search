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

#rss fetcher

SCRAPE_TIMEOUT_SECONDS = 120

logger = logging.getLogger(__name__)

def download_all_large_content_csv(queryState):
    print('hello world')
    print(queryState)
    print(_download_all_large_content_csv(queryState))


@background()
def _download_all_large_content_csv(queryState):
    return 'world'
