from django.db import models
from enum import Enum


class Collection(models.Model):
    name = models.CharField(max_length=255, null=False, blank=False)  # UI should verify uniqueness
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)


class ServiceNames(Enum):
    ONLINE_NEWS = "online_news"
    YOU_TUBE = "youtube"


class MediaTypes(Enum):
    AUDIO_BROADCAST = "audio_broadcast"
    DIGITAL_NATIVE = "digital_native"
    PRINT_NATIVE = "print_native"
    OTHER = "other"
    VIDEO_BROADCAST = "video_broadcast"


class Source(models.Model):
    name = models.CharField(max_length=1000, null=True)
    url_search_string = models.CharField(max_length=1000, null=True)
    label = models.CharField(max_length=255, null=True, blank=True)
    homepage = models.CharField(max_length=4000, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    service = models.CharField(max_length=100, choices=[(tag, tag.value) for tag in ServiceNames], null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    stories_per_week = models.IntegerField(default=0, null=True)
    pub_country = models.CharField(max_length=5, null=True, blank=True)
    pub_state = models.CharField(max_length=200, null=True, blank=True)
    primary_language = models.CharField(max_length=5, null=True, blank=True)
    media_type = models.CharField(max_length=100, choices=[(tag, tag.value) for tag in MediaTypes], null=True)

    collections = models.ManyToManyField(Collection)


class Feed(models.Model):
    url = models.TextField(null=False, blank=False)
    admin_rss_enabled = models.BooleanField(default=False, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    name = models.TextField(null=True, blank=True)

    source = models.ForeignKey(Source, on_delete=models.CASCADE)
