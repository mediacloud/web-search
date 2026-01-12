import sys

from django.core.management.base import BaseCommand

from settings import ADMIN_USERNAME
from ...tasks import scrape_source
from ...models import Source
from ....util.tasks import run_manage_task

class Command(BaseCommand):
    help = "Scrape source"

    def add_arguments(self, parser):
        parser.add_argument("--queue", action="store_true")
        parser.add_argument("--user", default=ADMIN_USERNAME, help="User to run task under.")
        parser.add_argument("source_id", type=int)
        parser.add_argument("email", type=str)

    def handle(self, *args, **options):
        sid = options["source_id"]
        email = options["email"]

        src = Source.objects.get(id=sid)
        if not src:
            print("could not find source id", sid)
            sys.exit(1)

        run_manage_task(
            func=scrape_source,
            homepage=src.homepage,
            name=src.name,
            source_id=sid,
            long_task_name=f"scrape source {sid}",
            queue=options["queue"],
            email=email,
            username=options["user"])
