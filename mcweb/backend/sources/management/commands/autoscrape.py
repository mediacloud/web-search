import sys

from django.core.management.base import BaseCommand

from ....util.tasks import TaskCommand
from ...tasks import autoscrape
from ...models import Source

# XXX maybe add options for:
# * all vs. monitored sources
# * number of sources to scrape in a batch
# * minimum time before rescrape in days?

class Command(TaskCommand):
    help = "Background rescrape"

    def add_arguments(self, parser):
        parser.add_argument("--all", action="store_true",
                            help="Consider all sources (else just monitored ones)")

        def_count = 1000
        parser.add_argument("--count", type=int, default=def_count,
                            help=f"Number of sources to scrape (default: {def_count})")

        parser.add_argument("--dry-run", action="store_true",
                            help="Disable scraping, updating.")

        def_min_age = 90
        parser.add_argument("--min-age", type=int, default=def_min_age,
                            help=f"Minimum days since last rescrape to consider (default: {def_min_age})")
                            
        
        super().add_arguments(parser)

    def long_task_name(self, options: dict):
        return f"autoscrape"

    def handle(self, *args, **options):
        self.run_task(
            func=autoscrape,
            options=options,
        )
