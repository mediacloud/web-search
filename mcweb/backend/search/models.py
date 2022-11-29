from django.db import models
import json

class SavedSearch(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)
