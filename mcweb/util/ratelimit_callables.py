from django.contrib.auth.models import Group

HIGH_RATE_LIMIT_GROUP = "api-high-rate-limit"

#A ratelimit callable which sets a higher ratelimit if the user is staff.
def story_list_rate(group, request):
    if request.user.groups.filter(name=HIGH_RATE_LIMIT_GROUP).exists() or request.user.is_staff: 
        return "100/m"
    else:
        return "2/m"
