from django.db import models
from enum import Enum


class Collection(models.Model):
    # UI should verify uniqueness
    name = models.CharField(max_length=255, null=False, blank=False)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)


class ServiceNames(Enum):
    OnlineNews = "online_news"
    YouTube = "youtube"


class Source(models.Model):
    name = models.CharField(max_length=1000, null=True)
    url_search_string = models.CharField(max_length=1000, null=True)
    label = models.CharField(max_length=255, null=True, blank=True)
    homepage = models.CharField(max_length=4000, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    service = models.CharField(max_length=100, choices=[(
        tag, tag.value) for tag in ServiceNames], null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    stories_per_week = models.IntegerField(default=0, null=True)
    #pub_country (enum)
    #pub_state (enum)
    #primary_language (enum)
    #media_type (enum)

    collections = models.ManyToManyField(Collection)


class Feed(models.Model):
    url = models.TextField(null=False, blank=False)
    admin_rss_enabled = models.BooleanField(default=False, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    name = models.TextField(null=True, blank=True)

    source = models.ForeignKey(Source, on_delete=models.CASCADE)

    # Create / Insert / Add - POST
    # Retrieve / Fetch - GET
    # Update / Edit - PUT
    # Delete / Remove - DELETE 
    # Crud Api
