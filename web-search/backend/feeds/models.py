from django.db import models


class Feeds(models.Model):
    # big int
    default_auto_field = models.BigAutoFeild()
    url = models.CharField()
    admin_rss_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
