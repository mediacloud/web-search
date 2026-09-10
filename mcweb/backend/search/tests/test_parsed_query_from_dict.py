import datetime as dt

from django.test import TestCase

from util.exceptions import UserValueError

from ..utils import parsed_query_from_dict


class ParsedQueryFromDictTest(TestCase):
    """
    parsed_query_from_dict turns the frontend's queryState objects into
    ParsedQuery, and is shared by every download-*-csv endpoint plus
    send-email-large-download-csv and download-all-queries -- untested
    directly before (only exercised incidentally through the CSV tests'
    happy paths).
    """

    def test_missing_query_raises_user_value_error(self):
        payload = {
            "platform": "onlinenews-mediacloud", "query": "",
            "collections": [], "sources": [],
            "startDate": "2026-08-01", "endDate": "2026-09-01",
        }
        with self.assertRaises(UserValueError):
            parsed_query_from_dict(payload, session_id=None)

    def test_valid_payload_produces_expected_parsed_query(self):
        payload = {
            "platform": "onlinenews-mediacloud", "query": "robots",
            "collections": [], "sources": [],
            "startDate": "2026-08-01", "endDate": "2026-09-01",
        }
        pq = parsed_query_from_dict(payload, session_id="user@example.com")
        self.assertEqual(pq.provider_name, "onlinenews-mediacloud")
        self.assertEqual(pq.query_str, "robots")
        self.assertEqual(pq.start_date, dt.datetime(2026, 8, 1))
        self.assertEqual(pq.end_date, dt.datetime(2026, 9, 1))
        self.assertEqual(pq.session_id, "user@example.com")
