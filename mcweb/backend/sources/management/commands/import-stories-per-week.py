from django.core.management.base import BaseCommand, CommandError
import os
from subprocess import call
import csv
import logging
import pandas as pd
import numpy as np
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
            data = pd.DataFrame(csv_reader)
            data['mean'] = data.groupby('source_id')['count'].rolling(30).mean().reset_index(0, drop=True)
            #  standard deviation for each source
            data['std_dev'] = data.groupby('source_id')['count'].rolling(30).std().reset_index(0, drop=True)
            # Flag sources that have an average of more than 5 stories per day
            data['flag'] = np.where(data['mean'] > 5, 1, 0)
            # Identify days where a source's number of stories is more than 2 standard deviations below the 30-day average
            data['alert'] = np.where(((data['count'] < (data['mean'] - 2*data['std_dev'])) & (data['flag'] == 1)), 1, 0)

            for index, row in data.iterrows():
                if row['alert'] == 1:
                    print(row['date'], row['source_id'])
            # for row in csv_reader:
                # try:
                #     source = Source.objects.get(id=int(row['sources_id']))
                #     source.stories_per_week = round((int(float(row['count'])) / 4))
                #     source.save()
                # except ObjectDoesNotExist as e:
                #     logger.error("Unknown source id {}".format(row['media_id']))


        self.stdout.write(self.style.SUCCESS('Done from "%s"' % file_path))
