"""
Regression tests for yesterday()/yesterday_aware() (task_utils.py) and
es_start()/es_end() (metadata_update.py), added when their utcnow()-based
implementations were replaced with the non-deprecated
datetime.now(timezone.utc) equivalent for the Python 3.12 upgrade
(utcnow()/utcfromtimestamp() are deprecated as of 3.12).

Both mc-providers and Elasticsearch queries require start/end dates to have
the same "naivete" (both naive or both aware) -- these pin down that
yesterday() stays naive and yesterday_aware() stays aware, since that's
exactly the kind of thing a slightly-wrong utcnow() replacement could break.
"""

import datetime as dt

from django.test import SimpleTestCase

from ..metadata_update import es_end, es_start
from ..task_utils import yesterday, yesterday_aware


class YesterdayTest(SimpleTestCase):
    def test_yesterday_is_naive(self):
        self.assertIsNone(yesterday().tzinfo)

    def test_yesterday_is_about_one_day_before_now(self):
        now = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)
        delta = now - yesterday()
        self.assertTrue(dt.timedelta(hours=23) < delta < dt.timedelta(hours=25))

    def test_days_argument_shifts_further_into_the_past(self):
        self.assertTrue(yesterday(days=5) < yesterday(days=0))

    def test_yesterday_aware_is_timezone_aware_utc(self):
        result = yesterday_aware()
        self.assertEqual(result.tzinfo, dt.timezone.utc)

    def test_yesterday_aware_matches_yesterday_wall_clock_time(self):
        naive = yesterday()
        aware = yesterday_aware()
        self.assertLess(abs((aware.replace(tzinfo=None) - naive).total_seconds()), 1)


class EsStartEndTest(SimpleTestCase):
    def test_es_start_is_naive(self):
        self.assertIsNone(es_start().tzinfo)

    def test_es_end_default_is_naive_and_matches_yesterday(self):
        self.assertIsNone(es_end().tzinfo)
        self.assertLess(abs((es_end() - yesterday()).total_seconds()), 1)

    def test_es_end_allow_future_is_naive_and_in_the_future(self):
        result = es_end(allow_future=True)
        self.assertIsNone(result.tzinfo)
        self.assertGreater(result, dt.datetime.now(dt.timezone.utc).replace(tzinfo=None))
