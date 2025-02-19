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
        parser.add_argument(
            "--provider-name",
            type=str,
            default="onlinenews-mediacloud",
            help="Name of the provider to use (default: onlinenews-mediacloud)",
        )

    def handle(self, *args, **options):
        batch_size = options["batch_size"]
        provider_name = options["provider_name"]

        if options["queue"]:
            update_source_language(provider_name=provider_name, batch_size=batch_size)
            self.stdout.write("Queued language analysis with a batch size of %d..." % batch_size)
        else:
            update_source_language.now(provider_name=provider_name, batch_size=batch_size)
            self.stdout.write(self.style.SUCCESS("Language analysis task completed with a batch size of %d." %batch_size))
