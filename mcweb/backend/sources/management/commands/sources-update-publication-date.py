from django.core.management.base import BaseCommand
from ...tasks import update_publication_date


class Command(BaseCommand):
    help = "Get the first publication date of a source and update the Source table."

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
            update_publication_date(batch_size=batch_size)
            self.stdout.write(f"Queued first story publication date analysis with a batch size of {batch_size}...")
        else:
            updated_sources = update_publication_date.now(batch_size=batch_size)
            if updated_sources:
                self.stdout.write(self.style.SUCCESS(f"Updated {len(updated_sources)} sources:"))
                for source in updated_sources:
                    self.stdout.write(f"Source ID {source['source_id']}: {source['first_story']}")
            else:
                self.stdout.write(self.style.WARNING("No sources were updated."))
