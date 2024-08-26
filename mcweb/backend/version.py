# three groups of imports, each alphabetized:

# standard:
import json
import os
import time

# PyPI:
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods

# web-search/mcweb:
from settings import VERSION, GIT_REV


@require_http_methods(["GET"])
def version(request):
    """
    /api/version
    simplest possible endpoint I could get working -phil
    maybe require authentication?
    """
    # could include "uptime" (now - start_time)?
    data = json.dumps({
        'GIT_REV': GIT_REV,
        'now': time.time(),                    # float: used by rss-fetcher
        'version': VERSION,
    })
    return HttpResponse(data, content_type='application/json', status=200)
