from django.core.management.base import BaseCommand, CommandError
import os
from subprocess import call
import csv
import logging
from django.core.exceptions import ObjectDoesNotExist
from ...models import Source

logger = logging.getLogger(__name__)


def _run_psql_command(cmd: str):
    db_uri = os.getenv('DATABASE_URI')
    call(['psql', '-Atx', db_uri, '-c', cmd])


class Command(BaseCommand):
    help = 'Update the stories-per-week for every media source'

    def add_arguments(self, parser):
        parser.add_argument('file_path')

    def handle(self, *args, **options):
        file_path = options['file_path']
        self.stdout.write(self.style.SUCCESS('Importing from "%s"' % file_path))

        if not os.path.exists(file_path):
            raise CommandError("Can't find file %s" % file_path)

        with open(file_path) as f:
            csv_reader = csv.DictReader(f)
            for row in csv_reader:
                try:
                    source = Source.objects.get(id=int(row['media_id']))
                    source.stories_per_week = round(7 * (int(row['count']) / 90))
                    source.save()
                except ObjectDoesNotExist as e:
                    logger.error("Unknown source id {}".format(row['media_id']))

        self.stdout.write(self.style.SUCCESS('Done from "%s"' % file_path))
