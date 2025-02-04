from django.core.management.base import BaseCommand
from ...tasks import update_source_language

class Command(BaseCommand):
    help = "Analyze the primary language of all sources in the database and update the Source table."

    def add_arguments(self, parser):
        parser.add_argument("--queue", action="store_true", help="Queue the task to run in the background.")
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Number of sources to process in each batch (default: 100)",
        )

    def handle(self, *args, **options):
        batch_size = options["batch_size"]

        if options["queue"]:
            update_source_language(batch_size=batch_size)
            self.stdout.write(f"Queued language analysis with a batch size of {batch_size}...")
        else:
            updated_sources = update_source_language.now(batch_size=batch_size)
            if updated_sources:
                self.stdout.write(self.style.SUCCESS(f"Updated {len(updated_sources)} sources:"))
                for source in updated_sources:
                    self.stdout.write(f"Source ID {source['source_id']}: {source['primary_language']}")
            else:
                self.stdout.write(self.style.WARNING("No sources were updated."))
