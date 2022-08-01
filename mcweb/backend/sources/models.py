from django.db import models


class Collection(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)  # UI should verify uniqueness
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
