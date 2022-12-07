from django.db import models
from enum import Enum
from typing import Dict


class CollectionPlatforms(Enum):
    ONLINE_NEWS = "online_news"
    REDDIT = "reddit"
    YOUTUBE = "youtube"


class Collection(models.Model):

    # UI should verify uniqueness
    name = models.CharField(max_length=255, null=False, blank=False)
    notes = models.TextField(null=True, blank=True)
    platform = models.CharField(max_length=100, choices=[(tag, tag.value) for tag in CollectionPlatforms], null=True,
                                default=CollectionPlatforms.ONLINE_NEWS.value)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)


class SourcePlatforms(Enum):
    ONLINE_NEWS = "online_news"
    YOUTUBE = "youtube"
    REDDIT = "reddit"


class MediaTypes(Enum):
    AUDIO_BROADCAST = "audio_broadcast"
    DIGITAL_NATIVE = "digital_native"
    PRINT_NATIVE = "print_native"
    OTHER = "other"
    VIDEO_BROADCAST = "video_broadcast"


class Source(models.Model):
    collections = models.ManyToManyField(Collection)

    name = models.CharField(max_length=1000, null=True)
    url_search_string = models.CharField(max_length=1000, null=True)
    label = models.CharField(max_length=255, null=True, blank=True)
    homepage = models.CharField(max_length=4000, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    platform = models.CharField(max_length=100, choices=[(tag, tag.value) for tag in SourcePlatforms], null=True,
                                default=SourcePlatforms.ONLINE_NEWS.value)
    stories_per_week = models.IntegerField(default=0, null=True)
    first_story = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    pub_country = models.CharField(max_length=5, null=True, blank=True)
    pub_state = models.CharField(max_length=200, null=True, blank=True)
    primary_language = models.CharField(max_length=5, null=True, blank=True)
    media_type = models.CharField(max_length=100, choices=[(tag, tag.value) for tag in MediaTypes], null=True)

    @classmethod
    def create_new_source(cls, source: Dict):
        new_source = Source()
        new_source.name = source["name"] if source["name"] is not None else None
        new_source.url_search_string = source["url_search_string"] if source["url_search_string"] is not None else None
        new_source.label = source["label"] if source["label"] is not None else None
        new_source.homepage = source["homepage"] if source["homepage"] is not None else None
        new_source.notes = source["notes"] if source["notes"] is not None else None
        new_source.service = source["service"] if source["service"] is not None else None
        new_source.stories_per_week = source["stories_per_week"] if source["stories_per_week"] is not None else None
        new_source.pub_country = source["pub_country"] if source["pub_country"] is not None else None
        new_source.pub_state = source["pub_state"] if source["pub_state"] is not None else None
        new_source.primary_language = source["primary_language"] if source["primary_language"] is not None else None
        new_source.media_type = source["media_type"] if source["media_type"] is not None else None
        new_source.save()
        new_source = Source.objects.get(pk=new_source.pk)
        return new_source


class Feed(models.Model):
    url = models.TextField(null=False, blank=False)
    admin_rss_enabled = models.BooleanField(default=False, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    name = models.TextField(null=True, blank=True)

    source = models.ForeignKey(Source, on_delete=models.CASCADE)
