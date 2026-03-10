from django.core.management.base import BaseCommand

from ...models import MetadataUpdateTask

class Command(BaseCommand):
    def handle(self, *args, **options):
        print(MetadataUpdateTask.last_metadata_updates())
