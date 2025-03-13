import csv
import io
from typing import Callable

from django.http import StreamingHttpResponse


# https://stackoverflow.com/questions/46694898/using-streaminghttpresponse-with-django-rest-framework-csv
def streaming_csv_response(iterator_func: Callable, filename: str | None = None, chunk_rows: int = 1000):
    """
    return StreamingHttpResponse with containing CSV encoded rows,
    with chunk_rows per HTTP chunk; previously streamed HTTP chunks
    of a single row, which meant a socket write system call, and possibily a
    single packet per row!

    "all-sources" manage command
    mcweb/backend/sources/management/commands/all-sources.py
    tests this routine!
    """
    buf = io.StringIO()
    writer = csv.writer(buf)

    iterator = iter(iterator_func())
    def _chunk():
        """
        returns string chunks with chunk_rows each
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
