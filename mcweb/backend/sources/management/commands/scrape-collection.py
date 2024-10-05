import sys

from django.core.management.base import BaseCommand

from ...tasks import _scrape_collection
from ...models import Collection

class Command(BaseCommand):
    help = "Scrape collection"

    def add_arguments(self, parser):
        parser.add_argument("--queue", action="store_true")
        parser.add_argument("collection_id", type=int)
        parser.add_argument("email", type=str)

    def handle(self, *args, **options):
        cid = options["collection_id"]
        email = options["email"]

        collection = Collection.objects.get(id=cid)
        if not collection:
            print("could not find collection id", cid)
            sys.exit(1)

        if options["queue"]:
            # queue to worker process
            _scrape_collection(cid, email)
        else:
            # run in-process
            _scrape_collection.now(cid, email)
