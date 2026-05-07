import sys

from django.core.management.base import BaseCommand

from ....util.tasks import TaskCommand
from ...tasks import autoscrape
from ...models import Source

class Command(TaskCommand):
    help = "Background rescrape"

    def add_arguments(self, parser):
        sources = parser.add_mutually_exclusive_group()
        sources.add_argument("--all", action="store_true",
                             help="Consider all sources (else just ones in monitored collections)")
        sources.add_argument("--featured", action="store_true",
                             help="Consider only featured collections (else all monitored ones)")
        sources.add_argument("--not-featured", action="store_true",
                             help="Never consider featured collections (else all monitored ones)")

        def_count = 500
        parser.add_argument("--count", type=int, default=def_count,
                            help=f"Number of sources to scrape (default: {def_count})")

        # to enable scraping just new sources:
        parser.add_argument("--days-old", type=int, default=None,
                            help="Only include new sources.")

        # for test/debug:
        parser.add_argument("--dry-run", action="store_true",
                            help="Disable scraping, updating.")

        # days since last scrape to consider ripe for rescrape
        # a required option (since could be VERY different depending on other options)
        parser.add_argument("--frequency", type=int, required=True,
                            help="Days between rescrapes of a source.")

        parser.add_argument("--no-stories", action="store_true",
                            help="Only scrape sources with zero or NULL stories_per_week.")
        
        super().add_arguments(parser)

    def long_task_name(self, options: dict):
        return f"autoscrape"

    def handle(self, *args, **options):
        self.run_task(
            func=autoscrape,
            options=options,
        )
