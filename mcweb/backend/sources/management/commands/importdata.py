from django.core.management.base import BaseCommand, CommandError
import os
from ...models import Collection, Source, Feed, ServiceNames
from subprocess import call


class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def _run_command(self, cmd: str):
        db_uri = os.getenv('DATABASE_URI')
        call(['psql', '-Atx', db_uri, '-c', cmd])

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

        # wipe and import Sources
        self.stdout.write(self.style.SUCCESS('Importing sources'))
        Source.objects.all().delete()
        cmd = "\\copy sources_source (id, name, url_search_string, label, homepage, notes, service) from " \
              "'import-data/sources.csv' CSV QUOTE '\"' HEADER".format(sources_path)
        self._run_command(cmd)
        self._run_command("UPDATE sources_source SET created_at=NOW(), modified_at=NOW()")

        # wipe and import Feeds
        self.stdout.write(self.style.SUCCESS('Importing feeds'))
        Feed.objects.all().delete()
        cmd = "\\copy sources_feed (id,source_id,name,url) from 'import-data/feeds.csv' CSV QUOTE '\"' HEADER".\
            format(feeds_path)
        self._run_command(cmd)
        self._run_command("UPDATE sources_feed SET created_at=NOW(), modified_at=NOW(), admin_rss_enabled=True, "
                          "service={}".format(ServiceNames.OnlineNews))

        # wipe and import Collections
        self.stdout.write(self.style.SUCCESS('Importing collections'))
        db_uri = os.getenv('DATABASE_URI')
        Collection.objects.all().delete()
        cmd = "\\copy sources_collection (id, name, notes) from 'import-data/coll.csv' CSV QUOTE '\"' HEADER".format(collection_path)
        self._run_command(cmd)
        self._run_command("UPDATE sources_collection SET created_at=NOW(), modified_at=NOW()")

        # wipe and import source-collection links
        self.stdout.write(self.style.SUCCESS('Importing source-collections links'))
        db_uri = os.getenv('DATABASE_URI')
        self._run_command("DELETE from sources_source_collections")
        cmd = "\\copy sources_source_collections from 'import-data/coll-sources.csv' CSV QUOTE '\"' HEADER".format(coll_src_links_path)
        self._run_command(cmd)

        self.stdout.write(self.style.SUCCESS('Done from "%s"' % file_dir))
