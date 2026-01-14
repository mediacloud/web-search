import sys

from django.core.management.base import BaseCommand

from settings import ADMIN_USERNAME
from ...tasks import scrape_collection
from ...models import Collection
from ....util.tasks import run_manage_task

class Command(BaseCommand):
    help = "Scrape collection"

    def add_arguments(self, parser):
        parser.add_argument("collection_id", type=int)
        parser.add_argument("email", type=str)

    def get_long_name(self, **options):
        cid = options["collection_id"]
        return f"scrape collection {cid}"

    def handle(self, *args, **options):
        cid = options["collection_id"]
        email = options["email"]

        collection = Collection.objects.get(id=cid)
        if not collection:
            print("could not find collection id", cid)
            sys.exit(1)

        self.run_task(
            func=scrape_collection,
            collection_id=cid,
            email=email
        )

