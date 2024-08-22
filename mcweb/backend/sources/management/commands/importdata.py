from django.core.management.base import BaseCommand, CommandError
import os
from subprocess import call
import glob
import tempfile

from ...models import Collection, Source, Feed
# import env from mcweb.settings

def _run_psql_command(cmd: str):
    # DATABASE_URL is supplied automagically by Dokku
    db_uri = os.getenv('DATABASE_URL') # get from settings.env?
    call(['psql', '-Atx', db_uri, '-c', cmd])


class Command(BaseCommand):
    help = 'Wipe and import all collections, sources, associations between them, feeds, and reset postgres seqeuences.'

    def handle(self, *args, **options):
        file_dir = tempfile.gettempdir()  # prints the current temporary directory
        self.stdout.write(self.style.SUCCESS('Importing from "%s"' % file_dir))

        # download the files
        urls = [
            'https://mediacloud-media-merge.s3.amazonaws.com/coll.csv.gz',
            'https://mediacloud-media-merge.s3.amazonaws.com/coll-sources.csv.gz',
            'https://mediacloud-media-merge.s3.amazonaws.com/sources.csv.gz',
            'https://mediacloud-media-merge.s3.amazonaws.com/feeds.csv.gz'
        ]
        for u in urls:
            call(['wget', u, '-P', file_dir])

        # unzip them all
        zipfiles = glob.glob("{}/*.gz".format(file_dir))
        for z in zipfiles:
            call(['gunzip', z])

        # validate inputs
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
        cmd = "\\copy sources_source (id, name, url_search_string, label, homepage, notes, platform, pub_country," \
              "pub_state, primary_language, media_type) from " \
              "'{}' CSV QUOTE '\"' HEADER".format(sources_path)
        _run_psql_command(cmd)
        _run_psql_command("UPDATE sources_source SET created_at=NOW(), modified_at=NOW(), platform='{}'".format(
            Source.SourcePlatforms.ONLINE_NEWS))
        _run_psql_command("UPDATE sources_source SET primary_language=NULL WHERE primary_language='none'")
        _run_psql_command("SELECT setval(pg_get_serial_sequence('\"sources_source\"','id'), coalesce(max(\"id\"), 1), max(\"id\") IS NOT null) FROM \"sources_source\";")
        
        # wipe and import Feeds
        self.stdout.write(self.style.SUCCESS('Importing feeds'))
        Feed.objects.all().delete()
        cmd = "\\copy sources_feed (id,source_id,name,admin_rss_enabled,url) from '{}' CSV QUOTE '\"' HEADER".\
            format(feeds_path)
        _run_psql_command(cmd)
        _run_psql_command("UPDATE sources_feed SET created_at=NOW(), modified_at=NOW(), admin_rss_enabled=True")
        _run_psql_command("SELECT setval(pg_get_serial_sequence('\"sources_feed\"','id'), coalesce(max(\"id\"), 1), max(\"id\") IS NOT null) FROM \"sources_feed\";")

        # wipe and import Collections
        self.stdout.write(self.style.SUCCESS('Importing collections'))
        Collection.objects.all().delete()
        cmd = "\\copy sources_collection (id, name, public, notes) from '{}' CSV QUOTE '\"' HEADER".format(
            collection_path)
        _run_psql_command(cmd)
        _run_psql_command("UPDATE sources_collection SET created_at=NOW(), modified_at=NOW(), platform='{}'".format(
            Source.SourcePlatforms.ONLINE_NEWS))
        _run_psql_command("UPDATE sources_collection SET public=True WHERE public is NULL")
        _run_psql_command("SELECT setval(pg_get_serial_sequence('\"sources_collection\"','id'), coalesce(max(\"id\"), 1), max(\"id\") IS NOT null) FROM \"sources_collection\";")

        # wipe and import source-collection links
        self.stdout.write(self.style.SUCCESS('Importing source-collections links'))
        _run_psql_command("DELETE from sources_source_collections")
        cmd = "\\copy sources_source_collections (collection_id,source_id) from '{}' " \
              "CSV QUOTE '\"' HEADER".format(coll_src_links_path)
        _run_psql_command(cmd)

        self.stdout.write(self.style.SUCCESS('Done from "%s"' % file_dir))
