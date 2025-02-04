from django.core.management.base import BaseCommand
from mcweb.backend.sources.tasks import update_source_language

class Command(BaseCommand):
    help = "Analyze the primary language of all sources in the database and update the Source table."

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of sources to process in each batch (default: 100)',
        )

    def handle(self, *args, **kwargs):
        batch_size = kwargs.get("batch_size", 100)
        self.stdout.write(f"Starting language analysis with a batch size of {batch_size}...")
        updated_sources = update_source_language(batch_size=batch_size)
        if updated_sources:
            self.stdout.write(self.style.SUCCESS(f"Updated {len(updated_sources)} sources:"))
            for source in updated_sources:
                self.stdout.write(f"Source ID {source['source_id']}: {source['primary_language']}")
        else:
            self.stdout.write(self.style.WARNING("No sources were updated."))
