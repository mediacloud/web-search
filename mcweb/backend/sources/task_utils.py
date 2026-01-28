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
from django.db.models import QuerySet, Q

# mcweb/backend/util/
from ..util.tasks import TaskCommand, get_task_provider

# local directory
from .models import Source

logger = logging.getLogger(__name__)

ES_PROVIDER = "onlinenews-mediacloud"
ES_PLATFORM = Source.SourcePlatforms.ONLINE_NEWS # platform column

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
    return dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days+1)

class MetadataUpdater:
    """
    Class for metadata updater tasks, invoked by MetadataUpdaterCommand
    subclass manage commands
    """
    UPDATE_FIELD: str           # Source field to update

    SOURCE_PAGE_SIZE = 5000     # make a command line option?

    # To add new arguments from the manage.py command line
    # add to MetadataUpdaterCommand.add_arguments
    def __init__(self, *, task_args: dict, options: dict):
        self.username = options["user"]
        self.long_task_name = task_args["long_task_name"]
        self.verbosity = options["verbosity"]

        self.platform = options["platform_name"]
        self.p = get_task_provider(provider_name=options["provider_name"],
                                   task_name=self.long_task_name)
        self.p.set_trace(options["provider_trace"])
        self.sources_to_update = []
        self.sleep_time = 60 / options["rate"]
        self.counters = collections.Counter()
        self.update = options["update"]
        self.process_child_sources = options["process_child_sources"]

        # not (YET) options(!!):
        # currently limited by number of query_string (OR) clauses
        # so limit parent source batch size:
        self.parent_batch_size = 32767

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
        # XXX take optional note string for ActionHistory, save as tuple?
        self.sources_to_update.append(source)

    def source_name(self, source):
        return source.url_search_string or source.name

    def sources_query(self) -> QuerySet:
        q = Source.objects.filter(name__isnull=False,
                                  platform=self.platform)\
                          .order_by("id")
        if not self.process_child_sources:
            # don't return child sources unless processing them
            q = q.filter(Q(url_search_string__isnull=True) |
                         Q(url_search_string__exact=""))
        return q

    def run(self) -> None:
        full_query = self.sources_query()
        parent_sources = []

        paginator = Paginator(full_query, self.parent_batch_size)
        for page_number in paginator.page_range:
            self.verbose(2, "sources query page %d", page_number)
            page = paginator.page(page_number)

            sources = page.object_list
            for source in sources:
                self.counters["scanned"] += 1
                if source.url_search_string:
                    if self.process_child_sources:
                        self.verbose_source(3, "processing %s", source)
                        # cannot aggregate by url_search_string
                        # need to query child sources one at a time;
                        # COULD handle multiple child sources, and
                        # even child sources mixed in with parents
                        # so long as only one parent or child for
                        # a domain is in the batch!!!
                        self.process_child_source(source)
                    else:
                        self.verbose_source(3, "skipping %s", source)
                else:
                    # here with a parent source, batch it up
                    parent_sources.append(source)
            # end for source in sources

            if parent_sources:
                self.process_parent_sources(parent_sources)
                parent_sources = []

            nupdate = len(self.sources_to_update)
            if nupdate > 0:
                if self.update:
                    logger.info("starting bulk_update %d", nupdate)
                    # painfully slow without batch_size?
                    Source.objects.bulk_update(self.sources_to_update,
                                               [self.UPDATE_FIELD], batch_size=100)
                    logger.info("updated %d sources", nupdate)
                    self.counters["updated"] += nupdate
                else:
                    logger.info("found %d sources to update", nupdate)
                    self.counters["found"] += nupdate
                self.sources_to_update = []

            if self.sleep_time > 0:
                self.verbose(3, "sleep %.3f", self.sleep_time)
                time.sleep(self.sleep_time)

        # end for page_number

        # final log message
        counters = ", ".join(f"{name}: {value}"
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
        # NOTE! does not include alternative domain names!!!
        # (would complicate keeping batches below domain list length limit)
        self.process_sources(sources=sources,
                             domains=[s.name for s in sources],
                             url_search_strings={})

    def process_child_source(self, source: Source) -> None:
        self.verbose(2, "process_child_source %s", source.url_search_string)
        self.process_sources(sources=[source],
                             domains=[],
                             url_search_strings={source.name: [source.url_search_string]})


class MetadataUpdaterCommand(TaskCommand):
    """
    base class for manage commands using MetaUpdater!!
    """
    def add_arguments(self, parser):
        # arguments here are handled in MetadataUpdater

        # slower (need to do one aggregation query per source),
        # and query results have been... questionable (provider bug?)
        # more debugging/testing needed
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

        parser.add_argument(
            "--provider-trace", type=int, default=0, help="Provider trace level.")
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
            options=options,
            **kwargs
        )
