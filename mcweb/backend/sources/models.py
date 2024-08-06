import logging
from typing import Dict

import feed_seeker.feed_seeker as feed_seeker
from mcmetadata.feeds import normalize_url
import mcmetadata.urls as urls
from django.db import models

# not from PyPI: package installed via github URL
from mc_sitemap_tools import find_gnews_fast

SCRAPE_TIMEOUT_SECONDS = 120
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

    class Meta:
        indexes = [
            # useful for search filtering
            models.Index(fields=['platform'], name='source platform'),
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
        platform = source.get("platform", None)
        if platform is not None and len(platform) > 0:
            obj.platform = platform
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
        platform = source.get("platform", None)
        if platform:
            obj["platform"] = platform.strip()
        
        homepage = source.get("homepage", None)
        if homepage:
            obj["homepage"] = homepage.strip()
        
        name = source.get("name", None)
        if name:
            obj["name"] = name.strip()
        if not name:
            if platform == 'online_news':
                    obj["name"] = urls.canonical_domain(homepage)
        
        url_search_string = source.get("url_search_string", None)
        if url_search_string:
            obj["url_search_string"] = url_search_string.strip()

        label = source.get("label", None)
        if label:
            obj["label"] = label.strip()
        if not label:
            obj["label"] = obj["name"]

        notes = source.get("notes", None)
        if notes:
            obj["notes"] = notes.strip()

        service = source.get("service", None)
        if service:
            obj["service"] = service.strip()

        stories_per_week = source.get("stories_per_week", None)
        if stories_per_week:
            obj["stories_per_week"] = stories_per_week

        pub_country = source.get("pub_country", None)
        if pub_country:
            obj["pub_country"] = pub_country.strip()

        pub_state = source.get("pub_state", None)
        if pub_state:
            obj["pub_state"] = pub_state.strip()

        primary_language = source.get("primary_language", None)
        if primary_language:
            obj["primary_language"] = primary_language.strip()

        media_type = source.get("media_type", None)
        if media_type:
            obj["media_type"] = media_type.strip()

        return obj
    
    @staticmethod
    def _scrape_source(source_id: int, homepage: str, name: str, verbose: bool = True) -> str:
        """
        returns text for email
        """
        logger.info(f"==== starting _scrape_source({source_id}, {homepage}, {name})")

        # create dict of full urls of current feeds indexed by normalized urls
        old_urls = {normalize_url(feed.url): feed.url
                    for feed in Feed.objects.filter(source_id=source_id)}
        found = set()           # normalized urls

        # header, might be only output if verbose is False and no new feeds found
        # NOTE! Each line appended to list must end with a newline!
        lines = [f"Scraped source {source_id} ({name}), {homepage}\n"]

        if not homepage:
            lines.append("MISSING HOMEPAGE\n")
            return "".join(lines)

        def process_urls(from_: str, urls: list[str]):
            for url in urls:
                nurl = normalize_url(url)
                if nurl not in old_urls:
                    logger.info(f"scrape_source({source_id}, {homepage}) found new {from_} feed {url}")
                    feed = Feed(source_id=source_id, admin_rss_enabled=True, url=url)
                    feed.save()
                    lines.append(f"added new {from_} feed {url}\n")
                else:
                    logger.info(f"scrape_source({source_id}, {homepage}) found old {from_} feed {url}")
                    found.add(nurl)

            if verbose:
                for nurl in found:
                    lines.append(f"found old {from_} feed {old_urls[nurl]}\n")
            # end process_feeds

        # Look for RSS feeds
        # create list so DB operations in process_urls are not under the timeout gun.
        new_feed_generator = feed_seeker.generate_feed_urls(homepage, max_time=SCRAPE_TIMEOUT_SECONDS)
        process_urls("rss", list(new_feed_generator))

        # Look for Google News Sitemaps (does NOT do full site crawl)
        # use feed_seeker alarm/signal based timeout.
        # NOTE! not in the public API, but better than copying?!
        with feed_seeker.timeout(SCRAPE_TIMEOUT_SECONDS):
            gnews_urls = find_gnews_fast(homepage)
        process_urls("news sitemap", gnews_urls)

        if verbose:
            not_found = set(old_urls.keys()) - found
            for nurl in not_found:
                lines.append(f"old feed {old_urls[nurl]} not found!\n")

            if len(lines) == 1: # just header
                lines.append("no new or old feeds\n")

        indent = "  "           # not applied to header line
        return indent.join(lines)

    @classmethod
    def update_stories_per_week(cls, source_id: int , weekly_story_count):
        try:
            source=Source.objects.get(pk=source_id) 
            source.stories_per_week = weekly_story_count
            source.save()
        except:
            logger.warn(f"source {source_id} not found")

    
class Feed(models.Model):
    url = models.TextField(null=False, blank=False, unique=True)
    admin_rss_enabled = models.BooleanField(default=False, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    name = models.TextField(null=True, blank=True)

    source = models.ForeignKey(Source, on_delete=models.CASCADE)
