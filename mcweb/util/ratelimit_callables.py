#A ratelimit callable which sets a higher ratelimit if the user is staff.
def story_list_rate(group, request):
    if request.user.groups.filter("power-users").exists() or request.user.is_staff(): 
        return "100/m"
    else:
        return "2/m"