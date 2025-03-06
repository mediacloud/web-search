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
            add_line(f"fatal error for {sitemaps}: {e!r}")
            logger.exception("find_gnews_fast")

        if gnews_urls:
            process_urls(sitemaps, gnews_urls)

        # after many tries to give a summary in english:
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

    
class Feed(models.Model):
    url = models.TextField(null=False, blank=False, unique=True)
    admin_rss_enabled = models.BooleanField(default=False, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    modified_at = models.DateTimeField(auto_now=True, null=True)
    name = models.TextField(null=True, blank=True)

    source = models.ForeignKey(Source, on_delete=models.CASCADE)
