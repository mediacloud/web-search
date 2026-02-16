"""
Utilities for source management tasks
"""

import collections
import datetime as dt
import json
import logging
import time                     # sleep
from typing import TypeAlias

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

ChildSourceDict: TypeAlias = collections.defaultdict[str, list[Source]]

class ChildSources:
    ALSO = "also"               # process all sources
    ONLY = "only"               # helpful for debugging!
    NEVER = "never"

CHILD_SOURCES_DEFAULT = ChildSources.ALSO

def monitored_collections():
    """
    return list of monitored/important collections
    (someday use a collection set??)
    """
    with open('mcweb/backend/sources/data/collections-to-monitor.json') as f:
        return json.load(f)

def yesterday(days=0):
    """
    returns a naive datetime for use in ES search ranges; mc_provider
    two_d_aggregation currently only handles timezone naive datetimes
    """
    return dt.datetime.utcnow() - dt.timedelta(days=days+1)

def yesterday_aware(days=0):
    """
    return a timezone aware UTC datetime
    for use in PG queries (for autoscrape)
    """
    return yesterday(days).replace(tzinfo=dt.timezone.utc)

class MetadataUpdater:
    """
    Class for metadata updater tasks, invoked by MetadataUpdaterCommand
    subclass manage commands.  Used by AlertSystem (in alerts.py)
    as well as by UpdateStoriesPerWeek, UpdateSourceLanguage, and
    FindLastStory in metadata_update.py
    """
    # required:
    UPDATE_FIELDS: list[str]    # Source fields to update
    BUCKETS_PER_SOURCE = 1
    SOURCE_PAGE_SIZE = 5000     # PG query page: make a command line option?

    # To add new arguments from the manage.py command line
    # add to MetadataUpdaterCommand.add_arguments
    def __init__(self, *, task_args: dict, options: dict):
        self.username = options["user"]
        self.verbosity = options["verbosity"]

        self.platform = options["platform_name"]
        self.p = get_task_provider(provider_name=options["provider_name"],
                                   task_name=self.__class__.__name__)
        self.p.set_trace(options["provider_trace"])
        self.sources_to_update = []
        self.sleep_time = 60 / options["rate"]
        self.counters = collections.Counter()
        self.update = options["update"]
        self.process_child_sources = options["process_child_sources"]
        self.source_ids = [int(x) for x in options["source_id"]]

        # was limited to 32767 by number of query_string (OR) clauses
        # until mc-providers v4.3.1, now the limit is ES maxClauseCount,
        # currently (Feb 2026) 42130
        # https://www.elastic.co/guide/en/elasticsearch/reference/8.17/search-settings.html#search-settings
        # says:
        #    Elasticsearch will now dynamically set the maximum number of allowed clauses
        #    in a query, using a heuristic based on the size of the search thread pool and
        #    the size of the heap allocated to the JVM. This limit has a minimum value of
        #    1024 and will in most cases be larger (for example, a node with 30Gb RAM and
        #    48 CPUs will have a maximum clause count of around 27,000). Larger heaps lead
        #    to higher values, and larger thread pools result in lower values.
        #
        #    Queries with many clauses should be avoided whenever possible. If you
        #    previously bumped this setting to accommodate heavy queries, you might need
        #    to increase the amount of memory available to Elasticsearch, or to reduce the
        #    size of your search thread pool so that more memory is available to each
        #    concurrent search.
        max_clause_count = 42100 # XXX maybe fetch maxClauseCount from ES (may vary by node)
        bucket_limit = self.p.MAX_2D_AGG_BUCKETS // self.BUCKETS_PER_SOURCE
        self.parent_batch_size = min(bucket_limit, max_clause_count)
        # four clauses per child source (Bool, Match domain, two wildcards)??
        self.child_batch_size = min(bucket_limit, max_clause_count // 4)
        logger.info("child_batch_size %d, parent_batch_size %d",
                    self.child_batch_size, self.parent_batch_size)

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

    def source_name(self, source):
        """
        consistent formatting for logging
        """
        return source.url_search_string or source.name

    def sources_query(self) -> QuerySet:
        q = Source.objects.filter(name__isnull=False,
                                  platform=self.platform)\
                          .order_by("id")

        if self.source_ids:     # specific source ids for testing
            q = q.filter(id__in=self.source_ids)
        elif self.process_child_sources == ChildSources.NEVER:
            # don't return child sources unless processing them
            q = q.filter(Q(url_search_string__isnull=True) |
                         Q(url_search_string__exact=""))
        elif self.process_child_sources == ChildSources.ONLY:
            q = q.filter(url_search_string__isnull=False)
        else:
            assert self.process_child_sources == ChildSources.ALSO
            # no filtering!
        return q

    def run(self) -> None:
        full_query = self.sources_query()
        parent_sources: list[Source] = []
        child_sources: ChildSourceDict = collections.defaultdict(list)

        paginator = Paginator(full_query, self.parent_batch_size)
        for page_number in paginator.page_range:
            self.verbose(2, "sources query page %d", page_number)
            page = paginator.page(page_number)

            sources = page.object_list
            for source in sources:
                self.counters["scanned"] += 1
                if source.url_search_string:
                    if self.process_child_sources == ChildSources.NEVER:
                        self.verbose_source(3, "skipping %s", source)
                    else:
                        child_sources[source.name].append(source)
                elif self.process_child_sources != ChildSources.ONLY:
                    # here with a parent source, batch it up
                    parent_sources.append(source)
                else:
                    self.verbose_source(3, "skipping %s", source)
            # end for source in sources

            if parent_sources:
                self.process_parents(parent_sources)
                parent_sources = []

            while len(child_sources) >= self.child_batch_size: # unlikely!!
                self.process_children(child_sources)

            self._update()

            if self.sleep_time > 0:
                self.verbose(3, "sleep %.3f", self.sleep_time)
                time.sleep(self.sleep_time)

        # end for page_number

        if child_sources:
            while child_sources:
                self.process_children(child_sources)
            self._update()

        # final log message
        counters = ", ".join(f"{name}: {value}"
                            for name, value in self.counters.items())
        if self.update:
            logger.info("totals: %s", counters)
        else:
            logger.info("totals: %s (no update)", counters)

    def _update(self):
        """
        helper for run; sync any updated sources
        """
        nupdate = len(self.sources_to_update)
        if nupdate > 0:
            if self.update:
                logger.info("starting bulk_update %d", nupdate)
                # painfully slow without batch_size?
                Source.objects.bulk_update(self.sources_to_update,
                                           self.UPDATE_FIELDS, batch_size=100)
                logger.info("updated %d sources", nupdate)
                self.counters["updated"] += nupdate
            else:
                logger.info("found %d sources to update (--update not given)", nupdate)
                self.counters["found"] += nupdate
            self.sources_to_update = []

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

    def process_parents(self, sources: list[Source]) -> None:
        self.verbose(2, "process_parents %d", len(sources))
        # NOTE! does not include alternative domain names!!!
        # (would complicate keeping batches below domain list length limit)
        self.counters["process_parents"] += 1
        self.process_sources(sources=sources,
                             domains=[s.name for s in sources],
                             url_search_strings={})

    def process_children(self, sources: ChildSourceDict) -> None:
        # child sources must not appear in a query with parent or siblings.
        self.verbose(2, "process_children %s", len(sources))
        sources_to_process: list[Source] = []
        url_search_strings: dict[str, list[str]] = {}
        to_delete: set[str] = set()

        # pick one child source off of list for each parent domain
        n = 0
        for name, srcs in sources.items():
            url_search_strings[name] = [srcs[0].url_search_string]
            src = srcs.pop(0)
            if len(srcs) == 0:
                to_delete.add(name) # mark for deletion
            sources_to_process.append(src)
            n += 1
            if n == self.child_batch_size:
                break

        # delete empty sources from ChildSourceDict
        for name in to_delete:
            self.verbose(3, "popping %s", name)
            sources.pop(name)

        self.verbose(3, "url_search_strings %s", url_search_strings)
        self.counters["process_children"] += 1
        self.process_sources(sources=sources_to_process,
                             domains=[],
                             url_search_strings=url_search_strings)


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
            choices=[ChildSources.NEVER, ChildSources.ONLY, ChildSources.ALSO],
            type=str,
            default=CHILD_SOURCES_DEFAULT,
            help=f"Control processing child sources (default: {CHILD_SOURCES_DEFAULT})."
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

        parser.add_argument("--source-id", action="append", default=[],
            help="Specific source ids (for testing).")

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
