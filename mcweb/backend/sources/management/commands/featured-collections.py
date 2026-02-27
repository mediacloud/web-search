from django.core.management.base import BaseCommand

from ...api import _featured_collections
from ...models import Collection

class Command(BaseCommand):
    help = 'Search sources and collections'

    def add_arguments(self, parser):
        DEF_PLAT = Collection.CollectionPlatforms.ONLINE_NEWS
        parser.add_argument("--platform",
                            help=f"Database platform name default: {DEF_PLAT}",
                            default=DEF_PLAT)

    def handle(self, *args, **options):
        platform = options["platform"]
        print("platform", platform, "featured collections")
        for c in _featured_collections(platform):
            print(c.id, c.name)
