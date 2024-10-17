import sys

from django.core.management.base import BaseCommand

from ...tasks import _scrape_source
from ...models import Source

class Command(BaseCommand):
    help = "Scrape source"

    def add_arguments(self, parser):
        parser.add_argument("--queue", action="store_true")
        parser.add_argument("source_id", type=int)
        parser.add_argument("email", type=str)

    def handle(self, *args, **options):
        sid = options["source_id"]
        email = options["email"]

        src = Source.objects.get(id=sid)
        if not src:
            print("could not find source id", sid)
            sys.exit(1)

        if options["queue"]:
            _scrape_source(sid, src.homepage, src.name, email)
        else:
            # run now
            _scrape_source.now(sid, src.homepage, src.name, email)
