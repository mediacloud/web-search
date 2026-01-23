import sys

from django.core.management.base import BaseCommand

from ....util.tasks import TaskCommand
from ...tasks import scrape_source
from ...models import Source

class Command(TaskCommand):
    help = "Scrape source"

    def add_arguments(self, parser):
        parser.add_argument("source_id", type=int)
        parser.add_argument("email", type=str)
        super().add_arguments(parser)

    def long_task_name(self, options: dict):
        sid = options["source_id"]
        return f"scrape source {sid}"

    def handle(self, *args, **options):
        sid = options["source_id"]
        email = options["email"]

        src = Source.objects.get(id=sid)
        if not src:
            print("could not find source id", sid)
            sys.exit(1)

        self.run_task(
            func=scrape_source,
            options=options,
            homepage=src.homepage,
            name=src.name,
            source_id=sid,
            email=email
        )
