from django.core.management.base import BaseCommand

from ...models import last_metadata_updates

class Command(BaseCommand):
    def handle(self, *args, **options):
        print(last_metadata_updates())
