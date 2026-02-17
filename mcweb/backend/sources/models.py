import logging
from typing import Dict
from datetime import datetime, timezone

# PyPI:
import mcmetadata.urls as urls
from django.contrib.auth.models import User
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models

logger = logging.getLogger(__name__)

class Collection(models.Model):

    class CollectionPlatforms(models.TextChoices):
        ONLINE_NEWS = "online_news"
        REDDIT = "reddit"
        TWITTER = "twitter"
        YOUTUBE = "youtube"

    # UI should verify uniqueness
    name = models.CharField(max_length=255, null=False, blank=False, unique=True)  
    notes = models.TextField(null=True, blank=True)
    platform = models.CharField(max_length=100, choices=CollectionPlatforms.choices, null=True,
                                default=CollectionPlatforms.ONLINE_NEWS)
    public = models.BooleanField(default=True, null=False, blank=False)  
    featured = models.BooleanField(default=False, null=False, blank=False)
    managed = models.BooleanField(default=False, null=False, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        permissions = (('edit_collection', 'Edit collection')),
        indexes = [
            # useful for search filtering
            models.Index(fields=['platform'], name='collection platform'),
        ]


class Source(models.Model):
    collections = models.ManyToManyField(Collection, blank=True)

    class SourcePlatforms(models.TextChoices):
        ONLINE_NEWS = "online_news"
        YOUTUBE = "youtube"
        TWITTER = "twitter"
        REDDIT = "reddit"

    class SourceMediaTypes(models.TextChoices):
        AUDIO_BROADCAST = "audio_broadcast"
        DIGITAL_NATIVE = "digital_native"
        PRINT_NATIVE = "print_native"
        VIDEO_BROADCAST = "video_broadcast"
        OTHER = "other"

    name = models.CharField(max_length=1000, null=True)
    url_search_string = models.CharField(max_length=1000, blank=True, null=True)
    label = models.CharField(max_length=255, null=True, blank=True)
    homepage = models.CharField(max_length=4000, null=False, blank=False)
    notes = models.TextField(null=True, blank=True)
    platform = models.CharField(max_length=100, choices=SourcePlatforms.choices, null=True,
                                default=SourcePlatforms.ONLINE_NEWS)
    stories_per_week = models.IntegerField(default=0, null=True)
    last_story = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    pub_country = models.CharField(max_length=5, null=True, blank=True)
    pub_state = models.CharField(max_length=200, null=True, blank=True)
    primary_language = models.CharField(max_length=5, null=True, blank=True)
    media_type = models.CharField(max_length=100, choices=SourceMediaTypes.choices, blank=True, null=True)
    alerted = models.BooleanField(default=False)
    last_rescraped = models.DateTimeField(null=True)
    last_rescraped_msg = models.CharField(max_length=500, null=True, blank=True)
    search_vector = SearchVectorField(null=True) # for keyword search

    # stories_total thru stories_date_empty updated by sources-meta-update "totals" task.
    # Signed INT4 good for 2 billion stories.: more than 50x the current largest
    # count (google.com, which is due to historic stories not having the final URL).
    # Storing total (instead of "date_good") because that's the raw datum from ES, AND
    # easier to query by hand if anything available.
    stories_total = models.IntegerField(default=None, null=True)
    # pub_date before settings.EARLIEST_AVAILABLE_DAET
    stories_date_past = models.IntegerField(default=None, null=True)
    # pub_date more than mcmetadata.MAX_FUTURE_PUB_DATE days in the future:
    stories_date_future = models.IntegerField(default=None, null=True)
    # pub_date is NULL:
    stories_date_empty = models.IntegerField(default=None, null=True)

    class Meta:
        indexes = [
            # useful for search filtering
            models.Index(fields=['platform'], name='source platform'),
            # for keyword search
            GinIndex(fields=['search_vector'], name='search_vector_gin_index'),
            # trigrams for ILIKE acceleration
            # (GIN faster to search, slower to build than GiST)
            # See migrations/0038.... for excruciatingly long discussion:
            GinIndex(fields=['name', 'label'],
                     opclasses=['gin_trgm_ops', 'gin_trgm_ops'],
                     name='source_name_label_gin_index'),
        ]
        constraints = [
            models.UniqueConstraint(fields=('name', 'platform', 'url_search_string'),
                                    name='unique names within platform'),
        ]

    @classmethod
    def create_from_dict(cls, source_info: Dict):
        new_source = Source()
        cls._set_from_dict(new_source, source_info)
        new_source.save()
        new_source = Source.objects.get(pk=new_source.pk)
        return new_source

    @classmethod
    def update_from_dict(self, source_info: Dict):
        Source._set_from_dict(self, source_info)
        self.save()
        return self
    
    @classmethod
    def _set_from_dict(cls, obj, source: Dict):
        name = source.get("name", None)
        if name is not None and len(name) > 0:
            obj.name = name
        platform = source.get("platform", Source.SourcePlatforms.ONLINE_NEWS)
        if platform is not None and len(platform) > 0:
            obj.platform = platform
        # last_rescraped = source.get("last_rescraped", None)
        # if last_rescraped is not None and len(last_rescraped) > 0:
        #     obj.last_rescraped = last_rescraped
        url_search_string = source.get("url_search_string", None)
        if url_search_string is not None and len(url_search_string) > 0:
            obj.url_search_string = url_search_string
        label = source.get("label", None)
        if label is not None and len(label) > 0:
            obj.label = label
        homepage = source.get("homepage", None)
        if homepage is not None and len(homepage) > 0:
            obj.homepage = homepage
        notes = source.get("notes", None)
        if notes is not None and len(notes) > 0:
            obj.notes = notes
        service = source.get("service", None)
        if service is not None and len(service) > 0:
            obj.service = service
        stories_per_week = source.get("stories_per_week", None)
        if stories_per_week is not None and len(stories_per_week) > 0:
            obj.stories_per_week = stories_per_week
        pub_country = source.get("pub_country", None)
        if pub_country is not None and len(pub_country) > 0:
            obj.pub_country = pub_country
        pub_state = source.get("pub_state", None)
        if pub_state is not None and len(pub_state) > 0:
            obj.pub_state = pub_state
        primary_language = source.get("primary_language", None)
        if primary_language is not None and len(primary_language) > 0:
            obj.primary_language = primary_language
        media_type = source.get("media_type", None)
        if media_type is not None and len(media_type) > 0:
            obj.media_type = media_type

    @classmethod
    def _clean_source(cls, source: Dict):
        obj={}
        platform = source.get("platform", Source.SourcePlatforms.ONLINE_NEWS)
        if not platform:
            platform = None
        if platform:
            obj["platform"] = platform.strip()
        
        homepage = source.get("homepage", None)
        if homepage:
            obj["homepage"] = homepage.strip()
        else:
            return None
        
        name = source.get("domain", None)
        if not name:
            name = None
        if name:
            obj["name"] = name.strip()
        if not name:
            obj["name"] = urls.canonical_domain(homepage)
        
        url_search_string = source.get("url_search_string", None)
        if not url_search_string:
            url_search_string = None
        if url_search_string:
            obj["url_search_string"] = url_search_string.strip()

        label = source.get("label", None)
        if not label:
            label = None
        if label:
            obj["label"] = label.strip()
        if not label:
            obj["label"] = obj["name"]

        notes = source.get("notes", None)
        if not notes:
            notes = None
        if notes:
            obj["notes"] = notes.strip()

        # service = source.get("service", None)
        # if service:
        #     obj["service"] = service.strip()

        # stories_per_week = source.get("stories_per_week", None)
        # if stories_per_week:
        #     obj["stories_per_week"] = stories_per_week

        pub_country = source.get("pub_country", None)
        if not pub_country:
            pub_country = None
        if pub_country:
            obj["pub_country"] = pub_country.strip()

        pub_state = source.get("pub_state", None)
        if not pub_state:
            pub_state = None
        if pub_state:
            obj["pub_state"] = pub_state.strip()

        # primary_language = source.get("primary_language", None)
        # if primary_language:
        #     obj["primary_language"] = primary_language.strip()

        # media_type = source.get("media_type", None)
        # if media_type:
        #     obj["media_type"] = media_type.strip()

        return obj
    

    @classmethod
    def update_stories_per_week(cls, source_id: int , weekly_story_count):
        try:
            source=Source.objects.get(pk=source_id) 
            source.stories_per_week = weekly_story_count
            source.save()
        except:
            logger.warning(f"source {source_id} not found")

    @classmethod
    def update_last_rescraped(cls, source_id: int, summary: str):
        try:
            source=Source.objects.get(pk=source_id) 
            source.last_rescraped = datetime.now(timezone.utc).isoformat()
            source.last_rescraped_msg = summary
            source.save()
        except:
            logger.warning(f"source {source_id} not found")

    @classmethod
    def domain_exists(cls, domain: str) -> bool:
        """
        Check if a source with the given domain exists.
        """
        return (Source.objects.filter(name=domain).exists() or 
            AlternativeDomain.objects.filter(domain=domain).exists())

    
class Feed(models.Model):
    url = models.TextField(null=False, blank=False, unique=True)
    admin_rss_enabled = models.BooleanField(default=False, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    name = models.TextField(null=True, blank=True)
    source = models.ForeignKey(Source, on_delete=models.CASCADE)


class AlternativeDomain(models.Model):
    """
    Alternative domain names for a source
    """
    source = models.ForeignKey(Source, on_delete=models.CASCADE)
    domain = models.CharField(max_length=255, null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['domain'], name='domain'),
            models.Index(fields=['source'], name='source'),
        ]

        constraints = [
            models.UniqueConstraint(fields=['source', 'domain'], name='unique_source_domain')
        ]


class ActionHistory(models.Model):
    """
    Simple event model for actions taken on Sources models above
    A symbolic edit to push on a new instance
    """

    #class ActionTypes(models.TextChoices):
    #    CREATE = "create"
    #    UPDATE = "update"
    #    DELETE = "delete"

    #    COPY_COLLECTION = "copy_collection"
    #    UPLOAD_SOURCES = "upload_sources"
    #    RESCRAPE = "rescrape"
    #    ADD_TO_COLLECTION = "add_to_collection"
    #    REMOVE_FROM_COLLECTION = "remove_from_collection"
        #Others? 

    class ModelType(models.TextChoices):
        SOURCE = "Source"
        COLLECTION = "Collection"
        FEED = "Feed"
        ALTERNATIVE_DOMAIN = "AlternativeDomain"

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    user_name = models.CharField(max_length=150, blank=True)  # Django User.username max_length
    user_email = models.CharField(max_length=254,  blank=True)  # Django User.email max_length
    action_type = models.CharField(max_length=50) #choices=ActionTypes.choices)
    object_model = models.CharField(max_length=50, choices=ModelType.choices)
    object_id = models.IntegerField(null=True, blank=True) 
    object_name = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    parent_event = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, 
                                     related_name='child_events')

    changes = models.JSONField(null=True, blank=True)
    notes = models.CharField(max_length=5000, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['object_model', 'object_id']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action_type', '-created_at']),
            models.Index(fields=['parent_event']),  # For filtering parent vs child events
        ]
    
    def is_parent(self):
        """Check if this is a parent event (has no parent itself)"""
        return self.parent_event is None
    
    def has_children(self):
        """Check if this event has child events"""
        return self.child_events.exists()
    
    def __str__(self):
        user_display = self.user_name or (self.user.username if self.user else "Anonymous")
        return f"{user_display} {self.action_type} {self.object_model} {self.object_id} at {self.created_at}"


# log_action moved to action_history.py
