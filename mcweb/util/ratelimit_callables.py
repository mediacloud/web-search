from django.contrib.auth.models import Group
from http import HTTPStatus
from django.http import HttpResponse
from django.conf import settings

#A ratelimit callable which sets a higher ratelimit if the user is staff.
def story_list_rate(group, request):
    print(f"story_limit_callable found groups {request.user.groups} for user {request.user}, authed?: {request.user.is_authenticated}")
    if request.user.groups.filter(name=settings.HIGH_RATE_LIMIT_GROUP).exists() or request.user.is_staff: 
        return "100/m"
    else:
        return "2/m"

class HttpResponseRatelimited(HttpResponse):
    status_code = HTTPStatus.TOO_MANY_REQUESTS