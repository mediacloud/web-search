"""
Classes to implement sources-meta-update management commands,
called from tasks.py via UPDATERS hash
(so tasks.py can stay slim)

should be imported directly ONLY by tasks.py!
"""

# standard:
import datetime as dt
import logging
import time                     # sleep

# PyPI:
from django.core.paginator import Paginator
from django.db.models import QuerySet
from django.utils import timezone

import numpy as np

# mcweb/backend/util/
from ..util.tasks import get_task_provider

# local dir mcweb/backend/sources
from .models import Source

logger = logging.getLogger(__name__)

UPDATERS = {}

def updater(cls):
    """
    register an updater class by name
    used by tasks.update_metadata for manage sources-meta-update command
    """
    name = getattr(cls, "NAME", None)
    if not name:
        name = cls.UPDATE_FIELD

    UPDATERS[name] = cls
    return cls

def yesterday(days=0):
    """
    used for ES search range
    """
    return dt.datetime.utcnow() - dt.timedelta(days=days+1)

class MetadataUpdater:
    UPDATE_FIELD: str           # Source field to update

    def filter_sources(self, queryset: QuerySet) -> QuerySet:
        """
        override to apply additional filtering
        """
        return queryset

    def process_sources(self, *, sources: list[Source], domains: list[str], url_search_strings: dict[str, list[str]]) -> list[Source]:
        """
        called with either a list of domains, and no url_search strings,
        or no domains and a single url_search_string

        override with method to perform aggregation and update sources as needed

        append sources that need updating to self.sources_to_update
        (will not be updated unless update=True
        """
        raise NotImplementedError("process_sources not implemented")

    def process_parent_sources(self, sources: list[Source]) -> None:
        self.verbose(2, "process_parent_sources %d", len(sources))
        self.process_sources(sources=sources,
                             domains=[s.name for s in sources],
                             url_search_strings={})

    def process_child_source(self, source: Source) -> None:
        self.verbose(2, "process_child_source %s", source.url_search_string)
        self.process_sources(sources=[source],
                             domains=[],
                             url_search_strings={source.name: [source.url_search_string]})

    def __init__(self, provider_name: str, platform: str, sleep_time: float, verbosity: int, update: bool):
        self.platform = platform
        self.p = get_task_provider(provider_name=provider_name,
                                   task_name=f"update {self.UPDATE_FIELD}")
        self.sources_to_update = []
        self.sleep_time = sleep_time
        self.total = 0
        self.update = update
        self.verbosity = verbosity

    def verbose(self, level: int, format: str, *args) -> None:
        """
        log additional messages if --verbosity given; default level is one
        """
        if self.verbosity >= level:
            logger.debug(format, *args)

    def sync(self) -> None:
        if self.sources_to_update:
            self.total += len(self.sources_to_update)
            if self.update:
                logger.info("starting bulk_update")
                Source.objects.bulk_update(self.sources_to_update, [self.UPDATE_FIELD])
                logger.info("updated %d sources", len(self.sources_to_update)) 
            else:
                logger.info("found %d sources to update", len(self.sources_to_update))
            self.sources_to_update = []

    def sleep(self) -> None:
        self.sync()
        if self.sleep_time > 0:
            self.verbose(3, "sleep %.3f", self.sleep_time)
            time.sleep(self.sleep_time)

    def run(self) -> None:
        # NOTE!! Does not handle alternate names!
        # order by id just for sanity watching it run
        sources = Source.objects.filter(name__isnull=False,
                                        platform=self.platform)\
                                .order_by("id")

        # apply additional filters
        sources = self.filter_sources(sources)

        # currently limited by number of boolean (OR) clauses, so limit
        # parent source batch size
        batch_size = 32767
        parent_sources = []

        paginator = Paginator(sources, 5000)
        for page_number in paginator.page_range:
            self.verbose(2, "sources query page %d", page_number)
            page = paginator.page(page_number)

            for source in page:
                if source.url_search_string:
                    self.verbose(3, "source %s (%d) %s", source.name, source.id, source.url_search_string)
                    # cannot aggregate by url_search_string
                    # need to query child sources one at a time
                    self.process_child_source(source)
                    self.sleep()
                else:
                    # here with a parent source, batch it up
                    self.verbose(3, "source %s (%d)", source.name, source.id)
                    parent_sources.append(source)
                    if len(parent_sources) == batch_size:
                        self.process_parent_sources(parent_sources)
                        parent_sources = []
                        self.sleep()
            # end for source
        # end for page_number

        # final batch, if any
        if parent_sources:
            self.process_parent_sources(parent_sources)
        self.sync()
        if self.update:
            logger.info("total %d sources updated", self.total)
        else:
            logger.info("total %d sources to update", self.total)


@updater
class UpdateStoriesPerWeek(MetadataUpdater):
    UPDATE_FIELD = "stories_per_week"

    def process_sources(self, sources: list[Source], domains: list[str], url_search_strings: list[str]) -> None:
        """
        called with either a list of domains, and no url_search strings,
        or a single domain and url_search_string
        """

        # 1-D aggregation would suffice (one outer bucket)!
        # simple count would suffice for single source (w/ url_search_string)
        agg = self.p.two_d_aggregation(end_date=yesterday(),
                                       interval="week",
                                       num_intervals=1,
                                       inner_field="media_name",
                                       domains=domains,
                                       filters=url_search_strings)

        # dict indexed by (single) date string, of dicts indexed by domain, of counts
        date_buckets = agg["buckets"]
        for domains in date_buckets.values(): # should loop at most once!
            for source in sources:    # loop over PG query results again
                weekly_count = domains.get(source.name, 0) # XXX maybe default to None?
                if source.stories_per_week != weekly_count:
                    self.verbose(2, "%s (%d): old %r new %d",
                                source.url_search_string or source.name, 
                                 source.id, source.stories_per_week, weekly_count)
                    # NOTE! no longer using Source.update_stories_per_week!
                    source.stories_per_week = weekly_count
                    self.sources_to_update.append(source)
                else:
                    self.verbose(3, "%s (%d): no change: %d",
                                 source.url_search_string or source.name, 
                                 source.id, source.stories_per_week)

LANG_COUNT_DAYS = 180  # number of days back to examine
LANG_COUNT_MIN = 10    # min count for top lang within LANG_COUNT_DAYS

@updater
class UpdateSourceLanguage(MetadataUpdater):
    NAME = "language"
    UPDATE_FIELD = "primary_language" # Source field updated

    def filter_sources(self, queryset: QuerySet) -> QuerySet:
        """
        only process sources without primary language
        """
        return queryset.filter(primary_language__isnull=True)

    def process_sources(self, sources: list[Source], domains: list[str], url_search_strings: list[str]) -> None:
        """
        called with either a list of domains, and no url_search strings,
        or a single url_search_string
        """
        agg = self.p.two_d_aggregation(start_date=yesterday(LANG_COUNT_DAYS),
                                       end_date=yesterday(),
                                       url_search_strings=url_search_strings,
                                       outer_field="media_name",
                                       inner_field="language",
                                       max_inner_buckets=1,
                                       domains=domains,
                                       filters=url_search_strings)

        # dict indexed by domain name, of ordered dict indexed by language, of counts
        domains = agg["buckets"]
        sources_to_update = []

        for source in sources:
            langs = domains.get(source.name, {})
            for lang, count in langs.items(): # should have at most one inner bucket!
                self.verbose(3, "%s (%d): %s: %d", source.name, source.id, lang, count)
                if count >= LANG_COUNT_MIN:
                    logger.info("%s (%d) found language %s (count %d)",
                                source.name, source.id, lang, count)
                    source.primary_language = lang
                    self.sources_to_update.append(source)
                break           # quit after one (only) inner bucket!
