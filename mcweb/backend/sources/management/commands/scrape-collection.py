import sys

from django.core.management.base import BaseCommand

from settings import ADMIN_USERNAME
from ...tasks import scrape_collection
from ...models import Collection
from ....util.tasks import run_manage_task

class Command(BaseCommand):
    help = "Scrape collection"

    def add_arguments(self, parser):
        parser.add_argument("--queue", action="store_true")
        parser.add_argument("--user", default=ADMIN_USERNAME, help="User to run task under.")
        parser.add_argument("collection_id", type=int)
        parser.add_argument("email", type=str)

    def handle(self, *args, **options):
        cid = options["collection_id"]
        email = options["email"]

        collection = Collection.objects.get(id=cid)
        if not collection:
            print("could not find collection id", cid)
            sys.exit(1)

        run_manage_task(
            func=scrape_collection,
            collection_id=cid,
            long_task_name=f"scrape collection {cid}",
            queue=options["queue"],
            email=email,
            username=options["user"])
