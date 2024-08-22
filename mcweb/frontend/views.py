import logging
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
import os
from settings import (
    ANALYTICS_MATOMO_DOMAIN,
    ANALYTICS_MATOMO_SITE_ID,
    SENTRY_DSN, SENTRY_ENV,
    SENTRY_JS_TRACES_RATE,
    SENTRY_JS_REPLAY_RATE,
    SYSTEM_ALERT,
    VERSION
)
import mc_providers as providers

logger = logging.getLogger(__name__)

@ensure_csrf_cookie
def index(request):
    # the main entry point for the web app - it just renders the index HTML file to load all the JS
    return render(request, 'frontend/index.html', dict(
        version=VERSION,
        providers=providers.available_provider_names(),
        analytics_matomo_domain=ANALYTICS_MATOMO_DOMAIN,
        analytics_matomo_id=ANALYTICS_MATOMO_SITE_ID,
        system_alert=SYSTEM_ALERT,
        sentry_config={
            "sentry_dsn": (SENTRY_DSN or "null"),
            "sentry_env": (SENTRY_ENV or "null"),
            "traces_rate": SENTRY_JS_TRACES_RATE,
            "replay_rate": SENTRY_JS_REPLAY_RATE,
        }

    ))
