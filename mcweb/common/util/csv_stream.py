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


class CSVStream:
    """Class to stream (download) an iterator to a
    CSV file."""

    def __init__(self, filename: str, iterator_func: Callable):
        self._filename = filename
        self._iterator_func = iterator_func

    def stream(self):
        # 1. Create our writer object with the pseudo buffer
        writer = csv.writer(CSVBuffer())
        # 2. Create the StreamingHttpResponse using our iterator as streaming content
        response = StreamingHttpResponse((writer.writerow(data) for data in self._iterator_func()),
                                         content_type="text/csv")
        # 3. Add additional headers to the response
        response['Content-Disposition'] = f"attachment; filename={self._filename}.csv"
        # 4. Return the response
        return response
