import time

from django.core.management.base import BaseCommand

from ...models import MetadataUpdateTask

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--cached", action="store_true")
        super().add_arguments(parser)

    def handle(self, *args, **options):
        t0 = time.monotonic()
        if options["cached"]:
            print(MetadataUpdateTask.last_metadata_updates())
        else:
            print(MetadataUpdateTask._last_metadata_updates())
        print(time.monotonic() - t0, "seconds")
