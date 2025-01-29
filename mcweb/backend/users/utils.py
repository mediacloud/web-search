def _clean_user(user):
    cleaned_user = {
        'id': user.id,
        'username': user.username,
        'is_staff': user.is_staff,
        'groups': [group.name for group in user.groups.all()]
    }
    return cleaned_user
