import logging
from typing import Dict
from datetime import datetime, timezone

# PyPI:
import feed_seeker
import mcmetadata.urls as urls
import requests
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models
from django.db.utils import IntegrityError
from mcmetadata.feeds import normalize_url
from mcmetadata.requests_arcana import insecure_requests_session
from mcmetadata.webpages import MEDIA_CLOUD_USER_AGENT

# not from PyPI: package installed via github URL
from mc_sitemap_tools.discover import NewsDiscoverer

# mcweb
from settings import SCRAPE_TIMEOUT_SECONDS # time to scrape an entire source

logger = logging.getLogger(__name__)

# time for individual HTTP connect/read
SCRAPE_HTTP_SECONDS = SCRAPE_TIMEOUT_SECONDS / 5

def rss_page_fetcher(url: str) -> str:
    """
    custom fetcher for RSS pages for feed_seeker
    (adapted from from feed_seeker default_fetch_function)
    """
    logger.debug("rss_page_fetcher %s", url)
    session = insecure_requests_session(MEDIA_CLOUD_USER_AGENT)

    try:
        # provide connection and read timeouts in case alarm based timeout fails
        # (scrapes sometimes hang).
        response = session.get(url,
                               timeout=(SCRAPE_HTTP_SECONDS, SCRAPE_HTTP_SECONDS))
        if response.ok:
            return response.text
        else:
            return ''  # non-fatal error
    except (requests.ConnectTimeout, # connect timeout
            requests.ConnectionError, # 404's
            requests.ReadTimeout,     # read timeout
            requests.TooManyRedirects, # redirect loop
            requests.exceptions.InvalidSchema, # email addresses
            requests.exceptions.RetryError):
        # signal page failure, but not bad enough to abandon site:
        return ''

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
    first_story = models.DateTimeField(null=True)
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

    class Meta:
        indexes = [
            # useful for search filtering
            models.Index(fields=['platform'], name='source platform'),
            # for keyword search
            GinIndex(fields=['search_vector'], name='search_vector_gin_index')
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
    
    @staticmethod
    def _scrape_source(source_id: int, homepage: str, name: str, verbosity: int = 1) -> str:
        """
        returns text for email
        """
        logger.info(f"==== starting _scrape_source({source_id}, {homepage}, {name})")

        # create dict of full urls of current feeds indexed by normalized urls
        old_urls = {normalize_url(feed.url): feed.url
                    for feed in Feed.objects.filter(source_id=source_id)}
        old = len(old_urls)

        # NOTE! Each line appended to list must end with a newline!
        lines = []
        def add_line(line):
            logger.debug("add_line: %s", line.rstrip()) # without newlines!
            if not line.endswith("\n"):
                line += "\n"
            lines.append(line)

        # per-source header line
        add_line(f"Scraped source {source_id} ({name}), {homepage}")

        if not homepage:
            add_line("MISSING HOMEPAGE")
            return "".join(lines) # error not indented

        total = added = confirmed = 0
        def process_urls(from_: str, urls: list[str]):
            nonlocal total, added, confirmed
            for url in urls:
                total += 1
                nurl = normalize_url(url)
                if nurl in old_urls:
                    if verbosity >= 1:
                        add_line(f"found existing {from_} feed {url}")
                    logger.info(f"scrape_source({source_id}, {homepage}) found existing {from_} feed {url}")
                    confirmed += 1
                else:
                    try:
                        feed = Feed(source_id=source_id, admin_rss_enabled=True, url=url)
                        feed.save()
                        add_line(f"added new {from_} feed {url}")
                        logger.info(f"scrape_source({source_id}, {homepage}) added new {from_} feed {url}")
                        old_urls[nurl] = url # try to prevent trying to add twice
                        added += 1
                    except IntegrityError:
                        # happens when feed exists, but under a different source!
                        # could do lookup by URL, and report what source (name & id) it's under....
                        add_line(f"{from_} feed {url} exists under some other source!!!")
                        logger.warning(f"scrape_source({source_id}, {homepage}) duplicate {from_} feed {url} (exists under another source?)")

            # end process_feeds

        # Look for RSS feeds
        try:
            new_feed_generator = feed_seeker.generate_feed_urls(
                homepage, max_time=SCRAPE_TIMEOUT_SECONDS, fetcher=rss_page_fetcher)
            # create list so DB operations in process_urls are not under the timeout gun.
            process_urls("rss", list(new_feed_generator))
        except requests.RequestException as e: # maybe just catch Exception?
            add_line(f"fatal error for rss: {e!r}")
            logger.warning("generate_feed_urls(%s): %r", homepage, e)
        except TimeoutError:
            add_line(f"timeout for rss")
            logger.warning("generate_feed_urls(%s): timeout", homepage)

        # Do quick look for Google News Sitemaps (does NOT do full site crawl)
        gnews_urls = []
        sitemaps = "news sitemap" # say something once, why say it again?

        try:
            nd = NewsDiscoverer(MEDIA_CLOUD_USER_AGENT)
            gnews_urls = nd.find_gnews_fast(homepage, timeout=SCRAPE_HTTP_SECONDS)
        except requests.RequestException as e:
            add_line(f"fatal error for {sitemaps} discovery: {e!r}")
            logger.exception("find_gnews_fast")

        if gnews_urls:
            process_urls(sitemaps, gnews_urls)

        # after many tries to give a summary in english
        # NOTE! duplicates can make the numbers seem incongruous!
        summary = f"{added}/{total} added, {confirmed}/{old} confirmed"
        add_line(summary)
        logger.info("%s", summary)
        # add last time this source was rescraped
        Source.update_last_rescraped(source_id=source_id, summary=summary)
        indent = "  "           # not applied to header line
        return indent.join(lines)

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
    """

    class ActionTypes(models.TextChoices):
        CREATE = "create"
        UPDATE = "update"
        DELETE = "delete"

        COPY_COLLECTION = "copy_collection"
        UPLOAD_SOURCES = "upload_sources"
        RESCRAPE = "rescrape"
        ADD_TO_COLLECTION = "add_to_collection"
        REMOVE_FROM_COLLECTION = "remove_from_collection"
        #Others? 

    class ModelType(models.TextChoices):
        SOURCE = "Source"
        COLLECTION = "Collection"
        FEED = "Feed"
        ALTERNATIVE_DOMAIN = "AlternativeDomain"

    user = models.ForeignKey('users.Profile', on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=50, choices=ActionTypes.choices)
    model_type = models.CharField(max_length=50, choices=ModelType.choices)
    #Rather than a foreign key? Hard on several tables, but it would be nice to put a link to the changed record somewhere, I think this is sufficient
    object_id = models.IntegerField(null=True, blank=True) 
    object_name = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    changes = models.JSONField(null=True, blank=True)
    note = models.CharField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['model_type', 'object_id']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user} {self.action_type} {self.model_type} {self.object_id} at {self.created_at}"


def log_action(user, action_type, model_type, object_id=None, object_name=None, 
               changes=None, notes=None):
    """
    Helper function to create an ActionHistory record.
    Returns the created ActionHistory instance.
    """
    return ActionHistory.objects.create(
        user=user if user.is_authenticated else None,
        action_type=action_type,
        model_type=model_type,
        object_id=object_id,
        object_name=object_name,
        changes=changes,
        notes=notes
    )

#Could be convinced this belongs elsewhere- a Mixin for the Django REST Framework Viewset that inserts overridden methods with logging utils
class ActionHistoryMixin:
    """Mixin that automatically tracks CRUD operations"""
    
    action_history_model_type = None  # Must be set by subclass
    
    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_action(ActionHistory.ActionTypes.CREATE, instance)
        return instance
    
    def perform_update(self, serializer):
        changed_fields = self._get_changed_fields(serializer)
        updated_instance = serializer.save()
        self._log_action(ActionHistory.ActionTypes.UPDATE, updated_instance, changed_fields)
        return updated_instance
    
    def perform_destroy(self, instance):
        self._log_action(ActionHistory.ActionTypes.DELETE, instance)
        instance.delete()
    
    def _get_object_name(self, instance):
        """
        Extract a human-readable name from the instance.
        Tries common field names like 'name', 'label', 'title', etc.
        """
        for attr in ['name', 'label', 'title', 'homepage']:
            if hasattr(instance, attr):
                value = getattr(instance, attr)
                if value:
                    return str(value)
        # Fallback to ID if no name field found
        return f"ID {instance.id}"

    def _get_changed_fields(self, serializer):
        """
        Extract changed fields from serializer by comparing validated_data
        with current instance values.
        
        Returns dict of {field_name: "old_value -> new_value"}
        """
        changed_fields = {}
        instance = serializer.instance
        
        for field, new_value in serializer.validated_data.items():
            old_value = getattr(instance, field, None)
            
            # Handle different value types
            if old_value != new_value:
                # Format the change nicely
                old_str = str(old_value) if old_value is not None else "None"
                new_str = str(new_value) if new_value is not None else "None"
                changed_fields[field] = f"{old_str} -> {new_str}"
        
        return changed_fields

    def _log_action(self, action_type, instance, changes=None, notes=None):
        """
        Helper method to create ActionHistory records.
        Only logs if action_history_model_type is set.
        """
        if not self.action_history_model_type:
            return
        
        try:
            log_action(
                user=self.request.user if self.request.user.is_authenticated else None,
                action_type=action_type,
                model_type=self.action_history_model_type,
                object_id=instance.id,
                object_name=self._get_object_name(instance),
                changes=changes,
                notes=notes,
            )
        except Exception as e:
            # Don't break the request if logging fails
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to log action history: {e}", exc_info=True)
