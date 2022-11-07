import logging
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

from settings import VERSION
import mcweb.backend.search.platforms as platforms

logger = logging.getLogger(__name__)


@ensure_csrf_cookie
def index(request):
    # the main entry point for the web app - it just renders the index HTML file to load all the JS
    return render(request, 'frontend/index.html', dict(
        version=VERSION,
        providers=platforms.available_provider_names()
    ))
