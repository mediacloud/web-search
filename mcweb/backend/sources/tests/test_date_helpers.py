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

from ..metadata_update import es_end
from ..task_utils import yesterday


class EsStartEndTest(SimpleTestCase):
    def test_es_end_default_is_naive_and_matches_yesterday(self):
        self.assertIsNone(es_end().tzinfo)
        self.assertLess(abs((es_end() - yesterday()).total_seconds()), 1)

    def test_es_end_allow_future_is_naive_and_in_the_future(self):
        result = es_end(allow_future=True)
        self.assertIsNone(result.tzinfo)
        self.assertGreater(result, dt.datetime.now(dt.timezone.utc).replace(tzinfo=None))
