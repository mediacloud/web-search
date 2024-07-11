import logging
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
import os
from settings import VERSION
import mc_providers as providers



logger = logging.getLogger(__name__)

ANALYTICS_MATOMO_DOMAIN = os.getenv('ANALYTICS_MATOMO_DOMAIN', "null")
ANALYTICS_MATOMO_SITE_ID = os.getenv('ANALYTICS_MATOMO_SITE_ID', "null")
SENTRY_DSN = os.getenv('SENTRY_DSN',"null")
SENTRY_ENV = os.getenv('STACK_NAME', "null")
SENTRY_TRACES_RATE = os.getenv('SENTRY_TRACES_RATE',"null")
SENTRY_REPLAY_RATE = os.getenv('SENTRY_REPLAY_RATE',"null")

SYSTEM_ALERT = os.getenv('SYSTEM_ALERT', None)

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
            "sentry_dsn": SENTRY_DSN,
            "sentry_env": SENTRY_ENV,
            "traces_rate": SENTRY_TRACES_RATE,
            "replay_rate": SENTRY_REPLAY_RATE,
        }

    ))
