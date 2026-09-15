import datetime as dt

from django.test import TestCase

from util.exceptions import UserValueError

from ..utils import _get_parse_date


class GetParseDateTest(TestCase):
    """
    _get_parse_date backs every date-range param on every search endpoint
    (via parse_query_params/parsed_query_from_dict) -- it accepts two
    different date formats depending on caller, and had no direct test.
    """

    def test_accepts_iso_format(self):
        self.assertEqual(
            _get_parse_date({"start": "2026-08-01"}, "start"),
            dt.datetime(2026, 8, 1))

    def test_accepts_us_slash_format(self):
        self.assertEqual(
            _get_parse_date({"start": "08/01/2026"}, "start"),
            dt.datetime(2026, 8, 1))

    def test_missing_value_raises_user_value_error(self):
        with self.assertRaises(UserValueError):
            _get_parse_date({}, "start")

    def test_blank_value_raises_user_value_error(self):
        with self.assertRaises(UserValueError):
            _get_parse_date({"start": ""}, "start")

    def test_malformed_value_raises_user_value_error(self):
        with self.assertRaises(UserValueError):
            _get_parse_date({"start": "not-a-date"}, "start")

    def test_wrong_separator_for_format_raises_user_value_error(self):
        # has a "-" so it's parsed as ISO, but isn't valid ISO -> should
        # still be a clean UserValueError, not an uncaught ValueError
        with self.assertRaises(UserValueError):
            _get_parse_date({"start": "2026/08-01"}, "start")
