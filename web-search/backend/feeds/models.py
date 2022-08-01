from django.db import models


class Feeds(models.Model):
    # big int
    id = models.BigIntegerField()
    url = models.TextField()
    admin_rss_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(modified_at=True)
