import sys

from django.core.management.base import BaseCommand

from ....util.tasks import TaskCommand
from ...tasks import scrape_collection
from ...models import Collection

class Command(TaskCommand):
    help = "Scrape collection"

    def add_arguments(self, parser):
        parser.add_argument("collection_id", type=int)
        parser.add_argument("email", type=str)
        super().add_arguments(parser)

    def long_task_name(self, options: dict):
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
            options=options,
            collection_id=cid,
            email=email
        )

