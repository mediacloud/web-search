def _clean_user(user):
    # Get the most recent quota
    most_recent_quota = user.quotahistory_set.order_by('-week').first()
    cleaned_user = {
        'id': user.id,
        'username': user.username,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'groups': [group.name for group in user.groups.all()],
        'quota': {
            'provider': most_recent_quota.provider,
            'hits': most_recent_quota.hits,
            'week': most_recent_quota.week.strftime('%Y-%m-%d'),
            'limit': user.profile.quota_mediacloud, 
        } if most_recent_quota else None
    }
    return cleaned_user
