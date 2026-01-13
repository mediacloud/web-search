"""
Utilities for source management (tasks mostly)
"""

import datetime as dt
import json
import logging
import time                     # sleep

# PyPI:
from django.core.paginator import Paginator
from django.db.models import QuerySet

# mcweb/backend/util/
from ..util.tasks import get_task_provider

# local directory
from .models import Source

logger = logging.getLogger(__name__)

ES_PROVIDER = "onlinenews-mediacloud"
ES_PLATFORM = "online_news"     # platform column in Source table

def monitored_collections():
    """
    return list of monitored/important collections
    (someday use a collection set??)
    """
    with open('mcweb/backend/sources/data/collections-to-monitor.json') as f:
        return json.load(f)

def yesterday(days=0):
    """
    used for ES search ranges
    """
    return dt.datetime.utcnow() - dt.timedelta(days=days+1)

class MetadataUpdater:
    UPDATE_FIELD: str           # Source field to update

    def __init__(self, *,
                 provider_name: str, platform: str,
                 sleep_time: float, verbosity: int, update: bool):
        self.platform = platform
        self.p = get_task_provider(provider_name=provider_name,
                                   task_name=self.provider_task_name())
        self.sources_to_update = []
        self.sleep_time = sleep_time
        self.total = 0          # maybe: totals = collections.Counter()?
        self.update = update
        self.verbosity = verbosity

        # currently limited by number of query_string (OR) clauses
        # so limit parent source batch size
        self.parent_batch_size = 32767
        self.parent_sources = []

    def verbose(self, level: int, format: str, *args) -> None:
        """
        log additional messages if --verbosity given; default level is one
        """
        if self.verbosity >= level:
            logger.debug(format, *args)

    def needs_update(self, source: Source):
        self.sources_to_update.append(source)

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
                    self.parent_sources.append(source)
                    if len(self.parent_sources) == self.parent_batch_size:
                        self.process_parent_sources(self.parent_sources)
                        self.parent_sources = []
                        self.sleep()
            # end for source
        # end for page_number

        # final batch, if any
        if self.parent_sources:
            self.process_parent_sources(self.parent_sources)
        self.sync()
        if self.update:
            logger.info("total %d sources updated", self.total)
        else:
            logger.info("total %d sources to update", self.total)


    def filter_sources(self, queryset: QuerySet) -> QuerySet:
        """
        override to apply additional filtering
        """
        return queryset

    def process_sources(self, *,
                        sources: list[Source],
                        domains: list[str],
                        url_search_strings: dict[str,list[str]]) -> None:
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

    def provider_task_name(self):
        return f"update {self.UPDATE_FIELD}"
