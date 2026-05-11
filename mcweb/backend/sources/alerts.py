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
from .pelt import prepare_daily_series, run_pelt, summarize_regime_changes
from .task_utils import MetadataUpdater, yesterday

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
        self.alert_algorithm = options.get("algorithm", "both")

        self.alert_dict = {
            "high": [],
            "low": [],
            "fixed": [],
            "pelt": [],
        }
        self.reports = 0

    def sources_query(self) -> QuerySet:
        """
        only process sources in monitored collections
        """
        return super().sources_query()\
                      .filter(collections__monitored=True)\
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
        agg = self._aggregate_counts(
            domains=domains,
            url_search_strings=url_search_strings,
        )
        buckets = agg["buckets"]
        mode = str(self.alert_algorithm).lower()

        if mode in ("legacy", "both"):
            self._process_sources_legacy(sources=sources, buckets=buckets)

        if mode in ("pelt", "both"):
            try:
                self._process_sources_pelt(sources=sources, buckets=buckets)
            except Exception:
                logger.exception("PELT alert path failed")
                if mode == "pelt":
                    logger.info("Falling back to legacy thresholds")
                    self._process_sources_legacy(sources=sources, buckets=buckets)

    def _aggregate_counts(self, *,
                          domains: list[str],
                          url_search_strings: dict[str, list[str]]) -> dict:
        return self.p.two_d_aggregation(
            end_date=yesterday(),
            interval=AGG_INTERVAL,
            num_intervals=NUM_INTERVALS,
            domains=domains,
            url_search_strings=url_search_strings,
            inner_field="media_name",
        )

    def _process_sources_legacy(self, *, sources: list[Source], buckets: dict) -> None:
        """
        called with either a list of domains, and no url_search strings,
        or a single url_search_string
        """
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

    def _report_pelt_change(self, *, source: Source, change: dict) -> None:
        pct_change = change.get("pct_change")
        pct_text = "n/a" if pct_change is None else f"{pct_change:.1f}%"
        msg = (
            f"Source {source.id}: {self.source_name(source)} regime change on {change['start']} "
            f"(change={pct_text}, median {change['prev_median']:.1f}->{change['curr_median']:.1f}, "
            f"mode {change['prev_mode']}->{change['curr_mode']})"
        )
        self.alert_dict.setdefault("pelt", []).append(msg)
        self.reports += 1
        logger.info("%s", msg)

    def _process_sources_pelt(self, *,
                              sources: list[Source],
                              buckets: dict) -> None:
        bucket_items = sorted(buckets.items(), key=lambda item: item[0])

        for source in sources:
            series = [
                {"date": bucket_date, "volume": bucket.get(source.name, 0)}
                for bucket_date, bucket in bucket_items
            ]

            if not series:
                logger.info("Source %d: %s has no aggregation buckets", source.id, self.source_name(source))
                continue

            # Keep stories_per_week updates consistent with the legacy alert path.
            week_counts = [int(row["volume"]) for row in series[LAST_WEEK:]]
            if self.update:
                Source.update_stories_per_week(source.id, sum(week_counts))

            start_date = dt.date.fromisoformat(str(series[0]["date"])[:10])
            end_date = dt.date.fromisoformat(str(series[-1]["date"])[:10])
            prepared = prepare_daily_series(series, start_date=start_date, end_date=end_date)
            run = run_pelt(
                start_date=start_date,
                end_date=end_date,
                dates=prepared.dates,
                volume=prepared.volume,
                log_volume=prepared.log_volume,
            )
            changes = summarize_regime_changes(segments=run.segments, volume=prepared.volume)

            # Emit one line per transition so downstream systems can choose policy.
            for change in changes:
                self._report_pelt_change(source=source, change=change.to_dict())

            # Optional compatibility with existing Source.alerted semantics:
            # alert when latest regime mode is exactly zero.
            latest_mode = run.segments[-1].mode_volume if run.segments else None
            if latest_mode == 0 and not source.alerted:
                source.alerted = True
                self.needs_update(source)
            elif latest_mode != 0 and source.alerted:
                source.alerted = False
                self.needs_update(source)

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
