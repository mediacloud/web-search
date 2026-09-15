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

    def test_content_type_is_text_csv(self):
        response = streaming_csv_response(lambda: iter([("a", "b")]))
        self.assertEqual(response["Content-Type"], "text/csv")

    def test_filename_sets_content_disposition(self):
        response = streaming_csv_response(lambda: iter([("a", "b")]), filename="my-export")
        self.assertEqual(response["Content-Disposition"], "attachment; filename=my-export.csv")

    def test_no_filename_omits_content_disposition(self):
        response = streaming_csv_response(lambda: iter([("a", "b")]))
        self.assertNotIn("Content-Disposition", response)

    def test_empty_iterator_produces_empty_content(self):
        response = streaming_csv_response(lambda: iter([]))
        self.assertEqual(_content(response), "")

    def test_all_rows_present_when_row_count_is_not_a_multiple_of_chunk_size(self):
        rows = [("id", "name"), (1, "alice"), (2, "bob"), (3, "carol")]
        response = streaming_csv_response(lambda: iter(rows), chunk_rows=2)

        self.assertEqual(_content(response), "id,name\r\n1,alice\r\n2,bob\r\n3,carol\r\n")

    def test_all_rows_present_when_row_count_is_an_exact_multiple_of_chunk_size(self):
        # an exact multiple triggers one extra (empty) chunk internally --
        # confirms that doesn't corrupt or duplicate any content
        rows = [("id", "name"), (1, "alice"), (2, "bob"), (3, "carol")]
        response = streaming_csv_response(lambda: iter(rows), chunk_rows=1)

        self.assertEqual(_content(response), "id,name\r\n1,alice\r\n2,bob\r\n3,carol\r\n")

    def test_rows_with_special_characters_are_csv_escaped(self):
        rows = [("name", "notes"), ("has,comma", 'has "quotes"')]
        response = streaming_csv_response(lambda: iter(rows))

        self.assertEqual(_content(response), 'name,notes\r\n"has,comma","has ""quotes"""\r\n')

    def test_iterator_func_is_only_called_once(self):
        calls = []

        def make_rows():
            calls.append(1)
            return iter([("a", "b"), (1, 2)])

        response = streaming_csv_response(make_rows, chunk_rows=1)
        _content(response)  # force full consumption

        self.assertEqual(len(calls), 1)
