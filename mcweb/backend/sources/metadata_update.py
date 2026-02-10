# XXX add --max-age argument to UpdateSourceLanguage??
"""
Classes to implement sources-meta-update management tasks

should be imported directly ONLY by tasks.py!
"""

# standard:
import datetime as dt
import logging

# PyPI
from django.db import transaction
from django.db.models import QuerySet

# mcweb/backend/util/
from ..util.tasks import TaskLogContext

# local dir mcweb/backend/sources
from .action_history import log_action # see NOTE in UpdateSourceLanguage
from .models import ActionHistory, Source, User
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
        called with either a list of domains, and empty url_search strings,
        or url_search_string with a single dict entry, with value
        of a list of search strings for a single source.
        """

        # 1-D aggregation would suffice (one outer bucket)!
        # simple count would suffice for single source (w/ url_search_string)
        agg = self.p.two_d_aggregation(end_date=yesterday(),
                                       interval="week",
                                       num_intervals=1,
                                       inner_field="media_name",
                                       domains=domains,
                                       url_search_strings=url_search_strings)

        # dict indexed by (single) date string, of dicts indexed by domain, of counts
        date_buckets = agg["buckets"]
        for domains in date_buckets.values(): # should loop at most once!
            for source in sources:    # loop over PG query results again
                # don't overwrite NULL with zero
                # (keep as signal nothing has ever been seen)
                weekly_count = domains.get(source.name, None)
                if weekly_count is None and source.stories_per_week is None:
                    self.verbose_source(2, "%s: keeping as NULL", source)
                else:
                    self.verbose_source(2, "%s: old %r new %d",
                                        source, source.stories_per_week, weekly_count)
                    if weekly_count != source.stories_per_week:
                        # NOTE! no longer using Source.update_stories_per_week!
                        source.stories_per_week = weekly_count
                        self.needs_update(source)
                    else:
                        self.verbose_source(3, "%s: no change: %d",
                                            source, weekly_count)

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
        # XXX filter by max age??
        return super().sources_query()\
                      .filter(primary_language__isnull=True)

    def run(self) -> None:
        self.user_object = User.objects.get(username=self.username)
        super().run()

    def process_sources(self, *,
                        sources: list[Source],
                        domains: list[str],
                        url_search_strings: dict[str,list[str]]) -> None:
        """
        called with either a list of domains, and empty url_search strings,
        or url_search_string with a single dict entry, with value
        of a list of search strings for a single source.
        """
        assert not (domains and url_search_strings)

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
                self.verbose_source(3, "%s: %s %d", source, lang, count)
                if count >= LANG_COUNT_MIN:
                    logger.info("%s (%d) found language %s (count %d)",
                                self.source_name(source), source.id,
                                lang, count)

                    # NOTE WELL!!!!  Before you copy this code!!!  This task
                    # does MANY orders of magnitude less updating than
                    # stories_per_week or last_story (likely to change live
                    # sources every week) AND only ever changes a source once,
                    # so it's reasonable to do updates on a per-source basis,
                    # since ActionHistory log entries are desired (and probably
                    # only tenable given the rarity of actions taken), so calling
                    # Source.save() directly rather than add log_entry creation
                    # to the batch update process.  Anyone NULLing out the language
                    # column may get a rude surprise!
                    if self.update:
                        with transaction.atomic():
                            source.primary_language = lang
                            source.save()
                            log_action(self.user_object, "update-language", ActionHistory.ModelType.SOURCE,
                                       source.id, source.name, # changes??
                                       notes=f"Set primary_language to {lang}")
                break           # quit after one (only) inner bucket!

# call only from tasks.py (via MetadataUpdaterCommand.run_task)
def sources_metadata_update(*,
                            task_args: dict, # TaskCommand
                            options: dict # MetdataUpdaterCommand
                            ) -> None:
    with TaskLogContext(task_args=task_args, options=options):
        for updater in options["task"]:
            logger.info("=== start update %s", updater)
            try:
                instance = UPDATERS[updater](task_args=task_args, options=options)
                instance.run()
            except:
                logger.exception("%s updater exception", updater)
            logger.info("=== end update %s", updater)

from elasticsearch_dsl.aggs import A

@updater
class FindLastStory(MetadataUpdater):
    UPDATE_FIELD = "last_story"

    def process_sources(self, *,
                        sources: list[Source],
                        domains: list[str],
                        url_search_strings: dict[str,list[str]]) -> None:
        """
        called with either a list of domains, and empty url_search strings,
        or url_search_string with a single dict entry, with value
        of a list of search strings for a single source.
        """

        p = self.p              # mc_provider

        # aggregation names:
        OUTER = "outer"
        INNER = "inner"

        # XXX nastiness: direct to elasticsearch_dsl:
        search = p._basic_search(user_query=p.everything_query(),
                                 start_date=dt.datetime(2008, 1, 1), # XXX
                                 end_date=yesterday(),
                                 domains=domains,
                                 url_search_strings=url_search_strings)\
                  .extra(size=0) # just aggs

        s = len(domains or url_search_strings)
        search.aggs.bucket(OUTER, A("terms", field="canonical_domain", size=s))\
                   .bucket(INNER, "max", field="publication_date")

        res = p._search(search, "pub-date-max")

        # dict by domain of max pub date
        max_date_by_domain = {
            outer["key"]: outer[INNER]["value_as_string"]
            for outer in res.aggregations[OUTER] # list of dicts
        }

        for source in sources:
            # NULL out domains with no stories found
            last_date = last_date_short = max_date_by_domain.get(source.name, None)

            # compare just the date part
            # (minimizes updates, helpful in debug)
            if last_date_short:
                last_date_short = last_date_short[:10] # YYYY-MM-DD

            curr = source.last_story
            if curr:
                curr = curr.strftime("%Y-%m-%d")

            if (last_date_short != curr or
                last_date is None and source.last_story is not None):
                source.last_story = last_date
                self.needs_update(source)
                self.verbose_source(2, "%s: was %s now %s", source, curr, last_date_short)
            else:
                self.verbose_source(3, "%s: was %s now %s (no update)", source, curr, last_date_short)
