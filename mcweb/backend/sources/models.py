from django.db import models
from enum import Enum


class Collection(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)  # UI should verify uniqueness
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)


class Feeds(models.Model):
    url = models.TextField(null=False, blank=False)
    admin_rss_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(modified_at=True, null=True)


 class ServiceStatus(Enum):
     Online = "online_news"
     YouTube = "youtube"

 class Sources(models.Model):
     name = models.CharField(max_length=1000)
     url_search_string = models.CharField(max_length=1000)
     label = models.CharField(max_length=255)
     homepage = models.CharField(max_length=1000)
     notes = models.TextField()
     service = models.CharField(choices=[(tag, tag.value) for tag in ServiceStatus])
     created_at = models.DateTimeField(auto_now_add=True, null=True)
     modified_at = models.DateTimeField(modified_at=True, null=True)
     stories_per_week = models.IntegerField(default=0, null=True)
     #pub_country (enum)
     #pub_state (enum)
     #primary_language (enum)
     #media_type (enum)
