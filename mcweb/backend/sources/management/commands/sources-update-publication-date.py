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
            self.stdout.write("Queued first story publication date analysis with a batch size of %d..." % batch_size)
        else:
            update_publication_date.now(batch_size=batch_size)
            self.stdout.write(self.style.SUCCESS("Publication date analysis task completed with a batch size of %d." %batch_size))
