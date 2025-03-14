import time

from django.db.models import Count, Subquery
from django.core.management.base import BaseCommand, CommandError

from ...models import Feed, Source
from backend.util import csv_stream

class Command(BaseCommand):
    help = 'Test generation of CSV for all news Sources with feeds (test for streaming_csv_response)'

    def add_arguments(self, parser):
        parser.add_argument('--verbose', action='count', default=0)

    def handle(self, *args, **options):
        # A copy of the query in mcweb.backend.sources.api.SourcesViewSet.with_feeds!!
        queryset = Source.objects.values_list('id')\
                                 .filter(platform=Source.SourcePlatforms.ONLINE_NEWS)\
                                 .annotate(feeds=Count('feed'))\
                                 .filter(feeds__gt=0)
        verbosity = int(options["verbose"])
        if verbosity >= 1:
            print(queryset.query)
        chunks = lines = 0
        t0 = time.monotonic()
        for c in csv_stream.streaming_csv_response(queryset.iterator).streaming_content:
            chunk_bytes = len(c)
            chunk_lines = len(c.split(b"\r\n")) - 1 # page lines, ignore trailing CRLF
            if verbosity >= 3:
                print("=== chunk")
                print(c.decode())
            elif verbosity >= 2:
                print(chunk_lines, chunk_bytes)
            lines += chunk_lines
            chunks += 1
        elapsed = time.monotonic() - t0
        print(chunks, "chunks", lines, "lines", round(elapsed, 6), "sec")


