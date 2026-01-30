"""
management command to swap primary and alternate domains
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import Source

#logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Swap primary and alternative domains'

    def add_arguments(self, parser):
        parser.add_argument("--update", action="store_true")
        parser.add_argument("source_id", type=int)
        parser.add_argument("primary", type=str)
        parser.add_argument("alternative", type=str)

    def handle(self, *args, **options):
        src_id = options["source_id"]

        # will raise exception if not found (primary key):
        src = Source.objects.get(id=src_id)

        primary = options["primary"]
        if src.name != primary:
            raise Exception(f"command line primary domain {primary} != src_id {src_id} name {src.name}")

        if src.url_search_string:
            raise Exception(f"src_id {src_id} name {src.name} has url_search string {src.url_src_string}")

        # will throw exception if not found, or more than one found!
        alternative = options["alternative"]
        alt = src.alternativedomain_set.get(domain=alternative)
        if options["update"]:
            print("updating...")
            with transaction.atomic():
                src.name = alternative
                src.save()
                alt.domain = primary
                alt.save()
            print("DONE")
        else:
            print("found alt", alt.id, alt.domain, "-- not updating")
