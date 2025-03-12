import time

from django.core.management.base import BaseCommand, CommandError

from ...models import Source
from backend.util import csv_stream

class Command(BaseCommand):
    help = 'Output CSV of all Sources (test for streaming_csv_response)'

    def handle(self, *args, **options):
        queryset = Source.objects.values_list('id')
        chunks = lines = 0
        t0 = time.monotonic()
        for c in csv_stream.streaming_csv_response(queryset.iterator).streaming_content:
            pl = len(c.split(b"\r\n")) - 1 # page lines, ignore trailing CRLF
            #print(pl)
            lines += pl
            chunks += 1
        elapsed = time.monotonic() - t0
        print(chunks, lines, elapsed)


