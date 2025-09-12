from django.contrib.auth.models import Group
from http import HTTPStatus
from django.http import HttpResponse

HIGH_RATE_LIMIT_GROUP = "api-high-rate-limit"

#A ratelimit callable which sets a higher ratelimit if the user is staff.
def story_list_rate(group, request):
    import logging
    logger = logging.getLogger(__name__)
    
    rate = "100/m" if (request.user.groups.filter(name=HIGH_RATE_LIMIT_GROUP).exists() or request.user.is_staff) else "2/m"
    logger.debug("story_list_rate: user %s, rate: %s", request.user, rate)
    return rate

class HttpResponseRatelimited(HttpResponse):
    status_code = HTTPStatus.TOO_MANY_REQUESTS