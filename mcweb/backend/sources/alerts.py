# XXX remove Source.update_stories_per_week??
# XXX create activity log entries when alerting/stopping???

"""
Source alert system

Now using provider aggregation queries to reflect what has been indexed
"""

# standard:
import datetime as dt
import logging

# PyPI:
import numpy as np
from django.db.models import QuerySet
from django.core.paginator import Paginator

# mcweb/util
from util.send_emails import send_alert_email

# mcweb/backend/util/
from ..util.tasks import TaskLogContext

# local dir mcweb/backend/sources
from .models import Source
from .task_utils import MetadataUpdater, yesterday, monitored_collections

# parameterized for experimentation
# (3 weeks instead of 28 days?)
AGG_INTERVAL = "day"
NUM_INTERVALS = 28
LAST_WEEK = -7

# added to email PER SOURCE!!
LONG = {
    "low": "is returning LOWER than usual story volume",
    "high": "is returning HIGHER than usual story volume",
    "fixed": "was alerting before and is now fixed"
}

logger = logging.getLogger(__name__)

class AlertSystem(MetadataUpdater):
    UPDATE_FIELDS = ["alerted"]
    BUCKETS_PER_SOURCE = NUM_INTERVALS

    def __init__(self, *, task_args: dict, options: dict):
        super().__init__(task_args=task_args, options=options)

        self.alert_dict = {
            "high": [],
            "low": [],
            "fixed": []
        }
        self.reports = 0

    def sources_query(self) -> QuerySet:
        """
        only process sources in monitored collections
        """
        collection_ids = monitored_collections()
        return super().sources_query()\
                      .filter(collections__id__in=collection_ids)\
                      .distinct()

    def report(self, source, level, lower, mean_last_week, upper):
        """
        update alert_dict used in alert-system.html template
        """
        self.verbose(2, "%s %s (%.1f %.1f %.1f)",
                     self.source_name(source), level, lower, mean_last_week, upper)

        name = self.source_name(source)

        # need ALL of this (prefix and LONG for EACH source???)
        long = f"Source {source.id}: {name} {LONG[level]}"
        self.alert_dict[level].append(long) # depend on template for newlines
        self.reports += 1
        logger.info("%s", long)

    def process_sources(self, *,
                        sources: list[Source],
                        domains: list[str],
                        url_search_strings: dict[str,list[str]]) -> None:
        """
        called with either a list of domains, and no url_search strings,
        or a single url_search_string
        """
        agg = self.p.two_d_aggregation(end_date=yesterday(),
                                       interval=AGG_INTERVAL,
                                       num_intervals=NUM_INTERVALS,
                                       domains=domains,
                                       url_search_strings=url_search_strings,
                                       inner_field="media_name")

        # dict indexed by date string, of dicts indexed by domain, of counts
        buckets = agg["buckets"]

        for source in sources:
            # XXX depends on each possible date bucket being present
            # need to pad with zeroes if not!!!
            counts = [bucket.get(source.name, 0)
                      for bucket in buckets.values()]
            if sum(counts) == 0:
                # XXX verbose only?
                logger.info("Source %d: %s not returning stories",
                            source.id, self.source_name(source))
                if not source.alerted:
                    source.alerted = True
                    self.needs_update(source)
            else:
                mean = np.mean(counts)
                std_dev = np.std(counts)

                week_counts = counts[LAST_WEEK:]
                mean_last_week = np.mean(week_counts)
                sum_last_week = sum(week_counts)

                lower = mean - 1.5 * std_dev # XXX can be negative!
                upper = mean + 2 * std_dev

                # re-fetches row, and updates!
                # _COULD_ change MetadataUpdater to update multiple fields...
                # use manage.py stories-metadata-update stories_per_week instead!!!!
                if self.update:
                    Source.update_stories_per_week(source.id, sum_last_week)

                if mean_last_week < lower:
                    self.report(source, "low", lower, mean_last_week, upper)
                    if not source.alerted:
                        source.alerted = True
                        self.needs_update(source)
                elif mean_last_week > upper:
                    self.report(source, "high", lower, mean_last_week, upper)
                    if not source.alerted:
                        source.alerted = True
                        self.needs_update(source)
                else:           # ingesting normally
                    if source.alerted:
                        self.report(source, "fixed", lower, mean_last_week, upper)
                        source.alerted = False
                        self.needs_update(source)
                    else:
                        self.verbose(2, f"Source %d: %s is ingesting at regular levels",
                                     source.id, self.source_name(source))

    def run(self):
        super().run()
        logger.info("alert_dict %r", self.alert_dict)
        if self.reports:
            send_alert_email(self.alert_dict)

# call only from tasks.py (via MetadataUpdaterCommand.run_task)
def alert_system(*, task_args:dict, options: dict):
    with TaskLogContext(task_args=task_args, options=options):
        as_ = AlertSystem(task_args=task_args, options=options)
        as_.run()
