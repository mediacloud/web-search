from django.core.management.base import BaseCommand

from ...models import Collection
from ...api import featured_collections

class Command(BaseCommand):
    help = 'Search sources and collections'

    def add_arguments(self, parser):
        DEF_PLAT = Collection.CollectionPlatforms.ONLINE_NEWS
        parser.add_argument("--platform",
                            help=f"Database platform name default: {DEF_PLAT}",
                            default=DEF_PLAT)

        cmdparser = parser.add_subparsers(dest="command")

        cmdparser.add_parser("list")

        set_rank = cmdparser.add_parser("set-rank")
        set_rank.add_argument("collection_id", type=int)
        set_rank.add_argument("rank", type=int)

        unfeature = cmdparser.add_parser("unfeature")
        unfeature.add_argument("collection_id", type=int)

    def handle(self, *args, **options):
        online_news = Collection.CollectionPlatforms.ONLINE_NEWS

        platform = options["platform"]

        command = options["command"]
        if command == "list":
            print("platform", platform, "featured collections")
            # NOTE!!! Uses same function as used in CollectionView!!!
            for c in featured_collections(platform):
                print(f"{c.id:-10d} | {str(c.featured_rank):>7s} | {c.name}")
        elif command == "set-rank":
            c = Collection.objects.get(id=options["collection_id"])
            c.featured = True
            c.featured_rank = options["rank"]
            c.save()
        elif command == "unfeature":
            c = Collection.objects.get(id=options["collection_id"])
            c.featured = False
            # NULL out featured_rank??
            c.save()
        else:
            print("Commands:")
            print("list")
            print("set-rank COLLECTION_ID RANK")
            print("unfeature COLLECTION_ID")
            print("also see --help ")
