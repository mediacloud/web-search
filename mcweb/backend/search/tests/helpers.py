from backend.users.models import QuotaHistory


def quota_hits(user, provider="onlinenews-mediacloud"):
    row = QuotaHistory.objects.filter(user_id=user.id, provider=provider).first()
    return row.hits if row else 0
