import csv
import io

from django.test import SimpleTestCase

from .csvwriter import CSVWriterHelper


def _rows(writer_buf: io.StringIO) -> list[list[str]]:
    return list(csv.reader(writer_buf.getvalue().splitlines()))


class CSVWriterHelperTest(SimpleTestCase):
    """
    CSVWriterHelper backs all four search CSV-download endpoints. Only
    exercised before through full view-level tests (test_download_csv.py);
    these call the static methods directly to isolate their row-shaping
    logic from the view/auth/quota machinery around them.
    """

    def setUp(self):
        self.buf = io.StringIO()
        self.writer = csv.writer(self.buf)

    def test_write_attn_over_time_normalized_rows(self):
        data = {"counts": [{"date": "2026-01-01", "count": 3, "total_count": 30, "ratio": 0.1}]}
        CSVWriterHelper.write_attn_over_time(self.writer, data, ["date", "count", "total_count", "ratio"])

        self.assertEqual(_rows(self.buf), [
            ["date", "count", "total_count", "ratio"],
            ["2026-01-01", "3", "30", "0.1"],
        ])

    def test_write_attn_over_time_non_normalized_rows(self):
        data = {"counts": [{"date": "2026-01-01", "count": 3}]}
        CSVWriterHelper.write_attn_over_time(self.writer, data, ["date", "count"])

        self.assertEqual(_rows(self.buf), [
            ["date", "count"],
            ["2026-01-01", "3"],
        ])

    def test_write_top_langs(self):
        data = [{"language": "en", "value": 42, "ratio": 1.0}]
        CSVWriterHelper.write_top_langs(self.writer, data, ["language", "count", "ratio"])

        self.assertEqual(_rows(self.buf), [
            ["language", "count", "ratio"],
            ["en", "42", "1.0"],
        ])

    def test_write_top_words(self):
        data = [{
            "term": "robots", "term_count": 5, "term_ratio": 0.5,
            "doc_count": 3, "doc_ratio": 0.3, "sample_size": 1000,
        }]
        CSVWriterHelper.write_top_words(
            self.writer, data,
            ["term", "term_count", "term_ratio", "doc_count", "doc_ratio", "sample_size"])

        self.assertEqual(_rows(self.buf), [
            ["term", "term_count", "term_ratio", "doc_count", "doc_ratio", "sample_size"],
            ["robots", "5", "0.5", "3", "0.3", "1000"],
        ])

    def test_write_top_sources(self):
        data = [{"source": "example.com", "count": 10, "ratio": 1.0}]
        CSVWriterHelper.write_top_sources(self.writer, data, ["source", "count", "ratio"])

        self.assertEqual(_rows(self.buf), [
            ["source", "count", "ratio"],
            ["example.com", "10", "1.0"],
        ])

