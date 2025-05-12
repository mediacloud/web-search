"""
management command to monitor the API

Run continuously, sleeping between requests for:
1. statefulness
2. to handle if/when tests bog down (take more than a reporting period)

_COULD_ have been part of statsd-agent, but didn't want any hold-ups
here to prevent timeliness of statsd-agent reports.
"""

import datetime as dt
import logging
import random
import sys
import time
from typing import NamedTuple

import requests
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
#from django.db.models import Q
from django.utils import timezone
from rest_framework.authtoken.models import Token

# mcweb/
from settings import _DOKKU, MONITOR_API_URL, MONITOR_API_USER, VERSION

# mcweb/util:
import util.stats as stats

logger = logging.getLogger(__name__)

USER_AGENT = f"{__name__} {VERSION}"

# sources
SRC_NYT = 1

# collections (ordered by ID)
COL_UK_ABYZ = 9315147 # UK National from ABYZ News Links
COL_US_NATIONAL = 34412234

class QueryTuple(NamedTuple):
    name: str                   # sources-shortname.period
    ss: list[int]
    cs: list[int]
    days: int
    q: str

class DateTuple(NamedTuple):
    start: dt.date
    end: dt.date

COLL_QSTR = (
    '('
    ' "affirmative action" OR "minorities admission"~5 OR'
    ' "minorities admissions"~5 OR "minority admission"~5 OR'
    ' "minority admissions"~5 OR "race admissions"~5 OR'
    ' "race admission"~5 OR "racial admission"~5 OR'
    ' "racial admissions"~5 OR "diversify enrollment"~5 OR'
    ' "student diversity" OR "race admit"~5 OR "racial admit"~5 OR'
    ' "Students for Fair Admissions"'
    ') AND ('
    ' colleg* OR universit* OR "higher ed" OR'
    ' "higher education" OR undergraduate'
    ')'
)
COLL_COL = [COL_US_NATIONAL, COL_UK_ABYZ] # college collections

COLLEGE = QueryTuple("college.31d", ss=[], cs=COLL_COL, days=31, q=COLL_QSTR)
# more queries here?
SLOW_QUERIES = [COLLEGE]

QUICK_QUERIES = [
    QueryTuple("nyt-democracy.1w", ss=[SRC_NYT], cs=[], days=7, q="democracy"),
    QueryTuple("usnat-peace.4w", ss=[], cs=[COL_US_NATIONAL], days=28, q="peace"),
]

MINUTE = 60

def listify(x):
    return ",".join(str(s) for s in x)

class Command(BaseCommand):
    help = 'Run statsd agent'

    def add_arguments(self, parser):
        parser.add_argument("--interval", type=int, default=5,
                            help="interval in minutes")

    def _get_token(self, user):
        k = Token.objects.filter(user__username=user).values("key").first()
        if k:
            return k["key"]
        return None

    def query(self, q: QueryTuple, dates: DateTuple,
              ep: str = "count-over-time"):
        # use requests for now to avoid bringing in mediacloud.api!
        params = [
            f"q={q.q}",
            f"start={dates.start.isoformat()}",
            f"end={dates.end.isoformat()}",
            "cache=-1",         # disable ALL caching
        ]
        if q.ss:
            params.append(f"ss={listify(q.ss)}")
        if q.cs:
            params.append(f"cs={listify(q.cs)}")

        query = '&'.join(params)
        url = f"{MONITOR_API_URL}/api/search/{ep}?{query}"
        try:
            t0 = time.monotonic()
            resp = requests.get(url, headers=self.headers)
            if resp.status_code == 200:
                ms = (time.monotonic() - t0) * 1000
                # maybe check response content-type header?
                j = resp.json() # ensure valid JSON
                statname = f"monitor-api.{q.name}.{ep}"
                logger.info("%s %.3f", statname, ms)
                stats.statsd_client.timing(statname, ms)
            else:
                pass            # XXX log error?
        except Exception as e:
            pass                # XXX log error?
    def random_dates(self, q: QueryTuple) -> DateTuple:
        # should use yesterday (UTC)
        last = dt.date(2025, 2, 28) # XXX last in new cluster 5/11/2025
        first = dt.date(2020, 1, 1) # earliest in both 5/11/2025
        max_days_after = (last - first).days - q.days
        end = last - dt.timedelta(days=int(random.random()*max_days_after))
        start = end - dt.timedelta(days=q.days)
        return DateTuple(start, end)

    def quick(self):
        """
        called on every wakeup to do quick checks
        """
        logger.debug("quick")
        for q in QUICK_QUERIES:
            dates = self.random_dates(q)
            self.query(q, dates)

    def slow(self):
        """
        called on every wakeup to do ONE slow check
        """
        logger.debug("slow %d", self.slow_index)
        q = SLOW_QUERIES[self.slow_index]
        dates = self.random_dates(q)
        self.query(q, dates, "count-over-time")
        self.query(q, dates, "words")
        self.slow_index = (self.slow_index + 1) % len(SLOW_QUERIES)

    def handle(self, *args, **options):
        interval = options["interval"] * 60
        self.slow_index = 0

        token = self._get_token(MONITOR_API_USER)
        if not (stats.statsd_client and MONITOR_API_URL and token):
            if _DOKKU:
                # under supervisord: just go catatonic
                print("unconfigured; sleeping")
                while True:
                    time.sleep(24*60*60) # use signal.pause?
            else:
                print("unconfigured; exiting")
                return

        self.headers = {
            "Accept": "application/json",
            f"Authorization": f"Token {token}",
            f"User-Agent": USER_AGENT,
        }
        while True:
            # NOTE! Using monotonic time (currently system uptime)
            # means that checks will not be done at the top of minutes
            # that are multiples of of "interval" and that instances
            # running on different servers will check at different
            # times.  This is a feature!
            now = time.monotonic()
            # calculate next time now, in case queries run long:
            next = now + interval - (now % interval)
            self.quick()
            self.slow()

            zzz = next - time.monotonic() # time to sleep
            if zzz > 0:         # next is in the future
                logger.debug("zzz %.3f", zzz)
                time.sleep(zzz)
