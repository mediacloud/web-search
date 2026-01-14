"""
Utilities for source management tasks
"""

import collections
import datetime as dt
import json
import logging
import time                     # sleep

# PyPI:
from background_task.tasks import TaskProxy
from django.core.paginator import Paginator
from django.db.models import QuerySet

# mcweb/backend/util/
from ..util.tasks import TaskCommand, get_task_provider

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
    """
    Class for metadata updater tasks, invoked by MetadataUpdaterCommand
    subclass manage commands
    """
    UPDATE_FIELD: str           # Source field to update

    SOURCE_PAGE_SIZE = 5000

    # To add new arguments, add to MetadataUpdaterCommand.run_task
    # updater_args dict.  To make them manage.py command line options,
    # also add to MetadataUpdaterCommand.add_arguments
    def __init__(self, *,
                 provider_name: str, platform: str,
                 rate: int, verbosity: int, update: bool,
                 process_child_sources: bool):
        self.platform = platform
        self.p = get_task_provider(provider_name=provider_name,
                                   task_name=self.provider_task_name())
        self.sources_to_update = []
        self.sleep_time = 60 / rate
        self.counters = collections.Counter()
        self.update = update
        self.verbosity = verbosity
        self.process_child_sources = process_child_sources

        # not (YET) options(!!):

        # currently limited by number of query_string (OR) clauses
        # so limit parent source batch size:
        self.parent_batch_size = 32767
        self.parent_sources = [] # for accumulating batches

    def verbose(self, level: int, format: str, *args) -> None:
        """
        log additional messages if --verbosity given; default level is one,
        min is zero, max is 3.
        """
        if self.verbosity >= level:
            logger.debug(format, *args)

    def verbose_source(self, level: int, format: str, source: Source, *args) -> None:
        """
        For verbose messages with formatted source info
        NOTE!! format must have initial %s argument!
        """
        if self.verbosity >= level:
            sstr = "source %s (%d)" % (self.source_name(source), source.id)
            logger.debug(format, sstr, *args)

    def needs_update(self, source: Source):
        self.sources_to_update.append(source)

    def sync(self) -> None:
        if self.sources_to_update:
            self.counters["processed"] += len(self.sources_to_update)
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

    def source_name(self, source):
        return source.url_search_string or source.name

    def sources_query(self) -> QuerySet:
        # NOTE!! Does not handle alternate names!
        return Source.objects.filter(name__isnull=False,
                                     platform=self.platform)\
                             .order_by("id")
    def run(self) -> None:
        sources = self.sources_query()

        paginator = Paginator(sources, self.SOURCE_PAGE_SIZE)
        for page_number in paginator.page_range:
            self.verbose(2, "sources query page %d", page_number)
            page = paginator.page(page_number)

            for source in page:
                self.counters["scanned"] += 1
                if source.url_search_string:
                    if self.process_child_sources:
                        self.verbose_source(3, "processing %s", source)
                        # cannot aggregate by url_search_string
                        # need to query child sources one at a time
                        self.process_child_source(source)
                        self.sleep()
                    else:
                        self.verbose_source(3, "skipping %s", source)
                else:
                    # here with a parent source, batch it up
                    self.verbose_source(3, "saving %s", source)
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

        # final log message
        counters = ",".join("{name}: {value}"
                            for name, value in self.counters.items())
        if self.update:
            logger.info("totals: %s", counters)
        else:
            logger.info("totals: %s (no update)", counters)


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

class MetadataUpdaterCommand(TaskCommand):
    """
    base class for manage commands using MetaUpdater!!
    """
    def add_arguments(self, parser):
        # slower (need to do one aggregation query per source),
        # and query results have been... questionable (provider bug?)
        parser.add_argument(
            "--process-child-sources",
            action="store_true",
            help=f"Process child sources (w/ url search strings) too."
        )

        # metadata update tasks were originally implemented
        # using "ordinary" provider methods (count over time, language)
        # so this wasn't utterly insane at the time:
        parser.add_argument(
            "--provider-name",
            type=str,
            default=ES_PROVIDER,
            help=f"Name of the provider to use (default: {ES_PROVIDER})",
        )

        parser.add_argument(
            "--platform-name",
            type=str,
            default=ES_PLATFORM,
            help=f"Name of the directory platform to use (default: {ES_PLATFORM})",
        )

        parser.add_argument("--rate", type=int, default=100,
                            help="Max ES queries per minute.")

        parser.add_argument("--update", action="store_true",
                            help="Perform database updates (else dry run)")
        super().add_arguments(parser)

    def run_task(self, func: TaskProxy, options: dict, **kwargs):
        """
        utility for invoking task function from handle method.

        func is a background task function that has been decorated
        with @background()

        options is full dict of arguments passed to handle method

        kwargs are passed to func.
        """
        super().run_task(
            func,
            options,
            updater_args={
                # bundle arguments to pass thru to MetadataUpdater
                # without needing to update all tasks to take new args!!
                "platform": options["platform_name"],
                "process_child_sources": options["process_child_sources"],
                "provider_name": options["provider_name"],
                "rate": options["rate"],
                "update": options["update"],
                "verbosity": options["verbosity"], # from BaseCommand class!
            },
            **kwargs
        )
