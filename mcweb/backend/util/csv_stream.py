import csv
import io
from typing import Callable

from django.http import StreamingHttpResponse


# https://stackoverflow.com/questions/46694898/using-streaminghttpresponse-with-django-rest-framework-csv
def streaming_csv_response(iterator_func: Callable, filename: str | None = None, chunk_rows: int = 1000):
    """
    return StreamingHttpResponse with containing CSV encoded rows,
    with chunk_rows per HTTP chunk (old solution returned one line per chunk,
    which meant a socket write system call, and possibily a single packet per row!

    paginates without knowing length of sequence, and without reading ahead.

    "all-sources" manage command
    mcweb/backend/sources/management/commands/all-sources.py
    tests this routine!
    """
    buf = io.StringIO()
    writer = csv.writer(buf)

    # This replaces sending single line HTTP chunks (lots of system calls and network packets)
    # so it doesn't matter a HUGE amount if this is a little slower than it could be...
    # writer.writerows() didn't seem to be better than multiple writerow calls.

    iterator = iter(iterator_func())
    def _chunk():
        """
        returns string chunks with chunk_rows each
        without reading ahead.
        """
        while True:
            rows = []
            for item in iterator:
                rows.append(item)
                if len(rows) >= chunk_rows:
                    break
            writer.writerows(rows)
            chunk = buf.getvalue()
            #print(len(rows), rows[0], rows[-1], len(chunk))
            yield chunk
            if len(rows) < chunk_rows:
                return
            buf.seek(0)         # rewind
            buf.truncate(0)     # clear buffer

    # 2. Create the StreamingHttpResponse using _chunk generator for chunks
    response = StreamingHttpResponse(_chunk(), content_type="text/csv")
    if filename:
        # 3. Add additional headers to the response
        response['Content-Disposition'] = f"attachment; filename={filename}.csv"
    # 4. Return the response
    return response
