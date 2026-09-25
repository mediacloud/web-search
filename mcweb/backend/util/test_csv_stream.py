from django.test import SimpleTestCase

from .csv_stream import streaming_csv_response


def _content(response) -> str:
    return b"".join(response.streaming_content).decode()


class StreamingCsvResponseTest(SimpleTestCase):
    """
    streaming_csv_response (used by several viewsets, including
    download_csv/with_feeds on Sources and Collections) builds a
    StreamingHttpResponse by hand-chunking an iterator -- pure logic, no DB
    -- but had no test beyond a manual "run this management command and
    eyeball it" note in its own docstring.
    """


    def test_all_rows_present_when_row_count_is_not_a_multiple_of_chunk_size(self):
        rows = [("id", "name"), (1, "alice"), (2, "bob"), (3, "carol")]
        response = streaming_csv_response(lambda: iter(rows), chunk_rows=2)

        self.assertEqual(_content(response), "id,name\r\n1,alice\r\n2,bob\r\n3,carol\r\n")

    def test_rows_with_special_characters_are_csv_escaped(self):
        rows = [("name", "notes"), ("has,comma", 'has "quotes"')]
        response = streaming_csv_response(lambda: iter(rows))

        self.assertEqual(_content(response), 'name,notes\r\n"has,comma","has ""quotes"""\r\n')
