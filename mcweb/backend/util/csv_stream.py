import csv
import io
from typing import Callable, Iterable

from django.http import StreamingHttpResponse


# https://stackoverflow.com/questions/46694898/using-streaminghttpresponse-with-django-rest-framework-csv
def streaming_csv_response(iterator_func: Callable[[], Iterable[tuple]],
                           filename: str | None = None, chunk_rows: int = 1000):
    """
    returns StreamingHttpResponse with containing CSV encoded rows,
    with chunk_rows per HTTP chunk to fill packets and ammortize
    overhead.

    `iterator_func` is a function that returns an iterable that
    returns row tuples (expects header if any to be the first tuple),
    hopefully a generator, so all the data doesn't need to be buffered.
 
    The "all-sources" manage command:
    mcweb/backend/sources/management/commands/all-sources.py
    tests this routine!

    Tried taking min chunk size (checking buf.tell() after each writerow)
    but buf is in unicode characters, not bytes...
    """
    buf = io.StringIO(newline='')
    writer = csv.writer(buf)

    # make a single use iterator from iterable (generator)
    # so that each "for row ..." doesn't restart from top
    iterator = iter(iterator_func())
    def _chunk():
        """
        returns string chunks with chunk_rows each
        """
        done = False
        while True:
            rows = []
            for row in iterator:
                rows.append(row)
                if len(rows) >= chunk_rows:
                    break
            else:
                done = True
            writer.writerows(rows)
            chunk = buf.getvalue()
            #print(len(rows), rows[0], rows[-1], len(chunk))
            yield chunk
            if done:
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
