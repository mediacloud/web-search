#import logging; logger = logging.getLogger(__name__) # for debug

from django.conf import settings
from rest_framework.authentication import SessionAuthentication

def query_rate(group, request):
    """
    A ratelimit callable which sets a higher ratelimit if the user is staff,
    and no limit for calls made from web UI
    """
    # when adding rate limit to all /api/search endpoints added this
    # test, so web UI calls are NEVER limited, BUT a simple test for a
    # cookie present in the request would have allowed spoofing.
    if isinstance(request.successful_authenticator, SessionAuthentication):
        return None             # no limit

    # check staff first to sidestep possible database access!
    if request.user.is_staff or request.user.groups.filter(name=settings.GROUPS.HIGH_RATE_LIMIT).exists():
        return "100/m"
    else:
        return "2/m"



