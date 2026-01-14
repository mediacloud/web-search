"""
Classes to implement sources-meta-update management tasks

should be imported directly ONLY by tasks.py!
"""

# standard:
import datetime as dt
import logging

# PyPI
from django.db.models import QuerySet

# mcweb/backend/util/
from ..util.tasks import TaskLogContext, get_task_provider

# local dir mcweb/backend/sources
from .models import Source
from .task_utils import MetadataUpdater, yesterday

logger = logging.getLogger(__name__)

UPDATERS = {}

def updater(cls):
    """
    decorator to register an updater class by name
    """
    name = getattr(cls, "NAME", None)
    if not name:
        name = cls.UPDATE_FIELD

    UPDATERS[name] = cls
    return cls


@updater
class UpdateStoriesPerWeek(MetadataUpdater):
    UPDATE_FIELD = "stories_per_week"

    def process_sources(self, *,
                        sources: list[Source],
                        domains: list[str],
                        url_search_strings: dict[str,list[str]]) -> None:
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
                                 self.source_name(source),
                                 source.id, source.stories_per_week, weekly_count)
                    # NOTE! no longer using Source.update_stories_per_week!
                    source.stories_per_week = weekly_count
                    self.needs_update(source)
                else:
                    self.verbose(3, "%s (%d): no change: %d",
                                 self.source_name(source),
                                 source.id, source.stories_per_week)

LANG_COUNT_DAYS = 180  # number of days back to examine
LANG_COUNT_MIN = 10    # min count for top lang within LANG_COUNT_DAYS

@updater
class UpdateSourceLanguage(MetadataUpdater):
    NAME = "language"
    UPDATE_FIELD = "primary_language" # Source field updated

    def sources_query(self) -> QuerySet:
        """
        only process sources without primary language
        """
        return super().sources_query()\
                      .filter(primary_language__isnull=True)

    def process_sources(self, *,
                        sources: list[Source],
                        domains: list[str],
                        url_search_strings: dict[str,list[str]]) -> None:
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

        # dict indexed by domain name,
        # of ordered dict indexed by language,
        # of counts
        domains = agg["buckets"]
        sources_to_update = []

        for source in sources:
            langs = domains.get(source.name, {})
            # should have at most one inner bucket!
            for lang, count in langs.items():
                self.verbose_source(3, "%s: %d", source, lang, count)
                if count >= LANG_COUNT_MIN:
                    logger.info("%s (%d) found language %s (count %d)",
                                self.source_name(source), source.id,
                                lang, count)
                    source.primary_language = lang
                    self.needs_update(source)
                break           # quit after one (only) inner bucket!

# call only from tasks.py (via MetadataUpdaterCommand.run_task)
def sources_metadata_update(*,
                            username: str, long_task_name: str, # TaskCommand
                            updater_args: dict, # MetdataUpdaterCommand
                            tasks: list[str]):
    with TaskLogContext(username=username, long_task_name=long_task_name):
        for updater in tasks:
            logger.info("=== start update %s", updater)
            try:
                instance = UPDATERS[updater](**updater_args)
                instance.run()
            except:
                logger.exception("%s updater exception", updater)
            logger.info("=== end update %s", updater)
