"""
Actual functions to implement misc. source tasks
(ones that don't do scraping, or use the MetadataUpdater framework
"""

# standard:
import logging

# mcweb/backend/util/
from ..util.tasks import TaskLogContext

# local directory:
from .models import Source

logger = logging.getLogger(__name__)

def tweak_stories_per_week(*, options: dict, task_args: dict):
    """
    Run after sources-meta-update for stories_per_week and last_story
    to make sure sources that have searchable stories have non-NULL
    stories_per_week.

    Depends on 0036_null_last_and_weekly migration
    which NULLs both stories_per_week and last_stories:
    last_story was formerly first_story and had values
    before 2008 (and who last_story value might also be pre-2008).
    stories_per_week was formerly based on rss-fetcher reports
    which may have reflected stories that were not indexed!

    The update is idempotent (does nothing after first run) but is
    being made a periodic task (a) to ensure things stay in line, and
    (b) make sure it runs after the last_story and stories_per_week
    are populated after the migration has run.
    """
    with TaskLogContext(task_args=task_args, options=options):
        # find online_news sources with searchable stories found
        # by "last_story" metadata updater, but none (yet)
        # by "stories_per_week"
        queryset = Source.objects.filter(
            platform=Source.SourcePlatforms.ONLINE_NEWS,
            last_story__isnull=False,
            stories_per_week__isnull=True)

        logger.info("%d candidates", queryset.count())
        if options["update"]:
            queryset.update(stories_per_week=0)
            logger.info("update complete")
