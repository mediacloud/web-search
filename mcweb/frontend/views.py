# Python
import logging
import os
import time

# PyPI
import mc_providers
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

# mcweb
from settings import (
    ALL_URLS_CSV_EMAIL_MAX,
    ALL_URLS_CSV_EMAIL_MIN,
    ANALYTICS_MATOMO_DOMAIN,
    ANALYTICS_MATOMO_SITE_ID,
    AVAILABLE_PROVIDERS,
    EARLIEST_AVAILABLE_DATE,
    SENTRY_DSN,
    SENTRY_ENV,
    SENTRY_JS_TRACES_RATE,
    SENTRY_JS_REPLAY_RATE,
    SYSTEM_ALERT,
    VERSION
)

logger = logging.getLogger(__name__)

# TEMPORARY! convert Unix timestamp to ISO date
_EARLIEST_AVAILABLE_DATE = EARLIEST_AVAILABLE_DATE
if _EARLIEST_AVAILABLE_DATE.isdigit(): # all digits?
    _EARLIEST_AVAILABLE_DATE = time.strftime("%Y-%m-%d", time.gmtime(int(_EARLIEST_AVAILABLE_DATE)))

@ensure_csrf_cookie
def index(request):
    # the main entry point for the web app - it just renders the index HTML file to load all the JS
    return render(request, 'frontend/index.html', dict(
        version=VERSION,
        providers=AVAILABLE_PROVIDERS,
        all_urls_csv_email_max=ALL_URLS_CSV_EMAIL_MAX,
        all_urls_csv_email_min=ALL_URLS_CSV_EMAIL_MIN,
        analytics_matomo_domain=ANALYTICS_MATOMO_DOMAIN,
        analytics_matomo_id=ANALYTICS_MATOMO_SITE_ID,
        earliest_available_date=_EARLIEST_AVAILABLE_DATE,
        system_alert=SYSTEM_ALERT,
        sentry_config={
            "sentry_dsn": (SENTRY_DSN or "null"),
            "sentry_env": (SENTRY_ENV or "null"),
            "traces_rate": SENTRY_JS_TRACES_RATE,
            "replay_rate": SENTRY_JS_REPLAY_RATE,
        }

    ))
