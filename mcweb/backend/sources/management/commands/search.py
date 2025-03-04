import time

from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.core.management.base import BaseCommand, CommandError

from ...models import Collection, Source

# help using search_vector column from
# https://medium.com/@nandagopal05/django-full-text-search-with-postgresql-f063aaf34e35
# code at https://github.com/NandaGopal56/Django-full-text-search

class Command(BaseCommand):
    help = 'Search sources and collections'

    def add_arguments(self, parser):
        parser.add_argument("--no-index", action="store_true", default=False)
        parser.add_argument("--show-query", action="store_true")
        parser.add_argument("token", nargs="+", type=str)

    def handle(self, *args, **options):
        v = SearchVector("name", "label")
        q = SearchQuery(" ".join(options["token"]))
        r = SearchRank(v, q)

        print("Sources")
        print("rank | id | domain | label")
        t0 = time.monotonic()
        queryset = Source.objects
        if not options.get("no_index"):
            print("HERE")
            queryset = queryset.filter(search_vector=q)
        queryset = queryset.annotate(rank=r).filter(rank__gte=0.01).order_by("-rank")
        if options.get("show_query"):
            print(queryset.query)
        for src in queryset[:10]:
            print(f"{src.rank:.6f} | {src.id} | {src.name} | {src.label}")
        t1 = time.monotonic()
        print(f"in {(t1 - t0):.6f} seconds", )
        print("")

        print("Collections")
        print("rank | id | name")
        v = SearchVector("name", weight="A")
        queryset = Collection.objects.annotate(rank=SearchRank(v, q)).filter(rank__gte=0.05).order_by("-rank")
        for coll in queryset[:10]:
            print(f"{coll.rank:.6f} | {coll.id} | {coll.name}")
        t2 = time.monotonic()
        print(f"in {(t2-t1):.6f} seconds", )


