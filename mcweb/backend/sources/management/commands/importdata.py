from django.core.management.base import BaseCommand, CommandError
import os
from ...models import Collection
from subprocess import call


class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument('dir', type=str)

    def handle(self, *args, **options):
        # validate inputs
        file_dir = options['dir']
        self.stdout.write(self.style.SUCCESS('Importing from "%s"' % file_dir))
        sources_path = os.path.join(file_dir, 'sources.csv')
        if not os.path.exists(sources_path):
            raise CommandError("Can't find file %s" % sources_path)
        feeds_path = os.path.join(file_dir, 'feeds.csv')
        if not os.path.exists(feeds_path):
            raise CommandError("Can't find file %s" % feeds_path)
        collection_path = os.path.join(file_dir, 'coll.csv')
        if not os.path.exists(collection_path):
            raise CommandError("Can't find file %s" % collection_path)
        coll_src_links_path = os.path.join(file_dir, 'coll-sources.csv')
        if not os.path.exists(coll_src_links_path):
            raise CommandError("Can't find file %s" % coll_src_links_path)
        # now run them
        db_uri = os.getenv('DATABASE_URI')
        Collection.objects.all().delete()
        cmd = "\\copy sources_collection (id, name, notes) from 'import-data/coll.csv' CSV QUOTE '\"' HEADER".format(collection_path)
        self.stdout.write(cmd)
        call(['psql','-Atx', db_uri, '-c', cmd])
        self.stdout.write(self.style.SUCCESS('Done from "%s"' % file_dir))
