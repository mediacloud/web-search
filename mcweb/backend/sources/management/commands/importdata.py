from django.core.management.base import BaseCommand, CommandError
import os
from ...models import Collection, Sources, Feeds
from subprocess import call


class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument('dir', type=str)

    def handle(self, *args, **options):
        db_uri = os.getenv('DATABASE_URI')

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

        # wipe and import Sources
        self.stdout.write(self.style.SUCCESS('Importing sources'))
        Sources.objects.all().delete()
        cmd = "\\copy sources_sources (id, name, url_search_string, label, homepage, notes, service) from " \
              "'import-data/sources.csv' CSV QUOTE '\"' HEADER".format(sources_path)
        call(['psql', '-Atx', db_uri, '-c', cmd])

        # wipe and import Feeds
        self.stdout.write(self.style.SUCCESS('Importing feeds'))
        Feeds.objects.all().delete()
        cmd = "\\copy sources_feeds (id,sources_id,note,url) from 'import-data/feeds.csv' CSV QUOTE '\"' HEADER".\
            format(feeds_path)
        call(['psql', '-Atx', db_uri, '-c', cmd])

        # wipe and import Collections
        self.stdout.write(self.style.SUCCESS('Importing collections'))
        db_uri = os.getenv('DATABASE_URI')
        Collection.objects.all().delete()
        cmd = "\\copy sources_collection (id, name, notes) from 'import-data/coll.csv' CSV QUOTE '\"' HEADER".format(collection_path)
        call(['psql', '-Atx', db_uri, '-c', cmd])

        # wipe and import source-collcetion links
        self.stdout.write(self.style.SUCCESS('Importing collections'))
        db_uri = os.getenv('DATABASE_URI')
        Collection.objects.all().delete()
        cmd = "\\copy sources_collection (id, name, notes) from 'import-data/coll.csv' CSV QUOTE '\"' HEADER".format(collection_path)
        call(['psql', '-Atx', db_uri, '-c', cmd])

        self.stdout.write(self.style.SUCCESS('Done from "%s"' % file_dir))
