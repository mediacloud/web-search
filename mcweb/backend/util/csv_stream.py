from django.http import StreamingHttpResponse
import csv
from typing import Callable


# solution pulled from https://gist.github.com/niuware/ba19bbc0169039e89326e1599dba3a87

class CSVBuffer:
    """An object that implements just the write method of the file-like
    interface.
    """
    def write(self, value):
        """Return the string to write."""
        return value


# https://stackoverflow.com/questions/46694898/using-streaminghttpresponse-with-django-rest-framework-csv
def streaming_csv_response(iterator_func: Callable, filename: str | None = None, chunk_rows: int = 1000):
    """
    return StreamingHttpResponse with containing CSV encoded rows,
    with chunk_rows per HTTP chunk
    """
    writer = csv.writer(CSVBuffer())

    # paginate without knowing length of sequence, chunking data.
    # writer.writerows doesn't return formatted data, as writer.writerow does,
    # AND it writes lines one at a time?!

    # This replaces sending single line HTTP chunks (lots of system calls and network packets)
    # so it doesn't matter a HUGE amount if this is a little slower than it could be...
    # writer.writerows() didn't seem to be better than multiple writerow calls.

    iterator = iter(iterator_func())
    def _pager():
        """
        returns chunks with chunk_rows each
        """
        while True:
            rows = []
            for item in iterator:
                rows.append(writer.writerow(item))
                if len(rows) >= chunk_rows:
                    break
            chunk = "".join(rows)
            #print(len(rows), rows[0].strip(), rows[-1].strip(), len(chunk))
            yield chunk
            if len(rows) < chunk_rows:
                return

    # 2. Create the StreamingHttpResponse using _pager generator for chunks
    response = StreamingHttpResponse(_pager(), content_type="text/csv")
    if filename:
        # 3. Add additional headers to the response
        response['Content-Disposition'] = f"attachment; filename={filename}.csv"
    # 4. Return the response
    return response
