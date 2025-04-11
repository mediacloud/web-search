"""
management command to run a statsd agent
(performing periodic DB queries reporting gauges)

Doesn't REALLY belong under "sources", but right now reporting tasks
(split between sources and searches, and could report on directory
counts) so closer to sources than to searches or users!
"""

import datetime as dt
import logging
import sys
import time
from collections import defaultdict

from background_task.models import Task, CompletedTask
from django.core.management.base import BaseCommand
from django.db.models import BooleanField, Count, ExpressionWrapper, Q
from django.utils import timezone

# mcweb/util:
import util.stats as stats

logger = logging.getLogger(__name__)

MINUTE = 60

class Command(BaseCommand):
    help = 'Run statsd agent'

    def add_arguments(self, parser):
        parser.add_argument("--queue-interval", type=int, default=MINUTE,
                            help="queue length check interval in seconds")

    def handle(self, *args, **options):
        queue_interval = options["queue_interval"]

        def qname(name: str | None) -> str:
            return name or "noname"

        # since gauges "stick" at last known value, must send zero if
        # no value returned, so maintain a set of all queues that have
        # ever been seen:
        known_queues = set(qname(q.queue)
                           for q in CompletedTask.objects.distinct("queue"))
        prev = timezone.now() - dt.timedelta(seconds=queue_interval)
        while True:
            # get instantaneous queue lengths
            # (unlikely to be illuminating unless backed up)
            queues = (Task.objects
                      .values("queue")
                      .annotate(len=Count("id")))

            def zero():
                return 0
            qlen = defaultdict(zero)
            for q in queues:
                name = qname(q.name)
                known_queues.add(name)
                qlen[name] = q.len

            # get count of completed tasks since last check, grouped by queue and success
            query = (CompletedTask
                     .objects.filter(run_at__gte=prev)
                     .values("queue") # before annotate!
                     .annotate(succ=ExpressionWrapper(Q(failed_at=None),
                                                      output_field=BooleanField()),
                               count=Count("id")))
            prev = timezone.now()

            # "completed" is dict indexed by queue name,
            # of list of counts indexed by bool "succ" (0/1)
            def pair():
                return [0, 0]
            completed = defaultdict(pair)
            for q in query:
                name = qname(q.name)
                completed[name][q.succ] = q.count
                known_queues.add(name)

            for name in known_queues:
                stats.gauge(["tasks", "waiting"], qlen[name], [("queue", name)])
                for succ in [False, True]:
                    stats.gauge(["tasks", "completed"], completed[name][succ],
                                [("queue", name), ("success", "ft"[succ])])

            time.sleep(queue_interval - time.time() % queue_interval)
