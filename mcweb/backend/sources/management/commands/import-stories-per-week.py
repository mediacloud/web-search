from django.core.management.base import BaseCommand, CommandError
import os
from subprocess import call
import csv
import logging
import pandas as pd
import numpy as np
from ...rss_fetcher_api import RssFetcherApi
from django.core.exceptions import ObjectDoesNotExist
from ...models import Source


logger = logging.getLogger(__name__)


def _run_psql_command(cmd: str):
    db_uri = os.getenv('DATABASE_URI')
    call(['psql', '-Atx', db_uri, '-c', cmd])


class Command(BaseCommand):
    help = 'Update the stories-per-week for every media source'

    # def add_arguments(self, parser):
    #     parser.add_argument('file_path')

    def handle(self, *args, **options):
        # file_path = options['file_path']
        # self.stdout.write(self.style.SUCCESS('Importing from "%s"' % file_path))

        # if not os.path.exists(file_path):
        #     raise CommandError("Can't find file %s" % file_path)
        
        # Add call to Rss fetcher to get data
        with RssFetcherApi() as rss:
            # stories_by_source = rss.stories_by_source() # This will generate tuples with (source_id and stories_per_day)
                # in the future may want to default to list of source_ids...we have a list of collections that research would like monitored
                # we can generate a list of source_ids from the collections and iterate throug those
                # first pass maybe run through all sources and find high volume sources
            # print(stories_by_source)
            # iterate through all sources and find source_ids with >= 5 stories/day

            # iterate through all source ids
            # for source_id in source_ids:
                # stories_fetched = rss.source_stories_fetched_by_day(4415) 
                # print(stories_fetched)
                # returns [{'date': '2023-02-19', 'count': 22}, {'date': '2023-02-20', 'count': 44}, {'date': '2023-02-21', 'count': 68}, {'date': '2023-02-22', 'count': 76}, {'date': '2023-02-23', 'count': 55}, {'date': '2023-02-24', 'count': 62}, {'date': '2023-02-25', 'count': 38}, {'date': '2023-02-26', 'count': 44}, {'date': '2023-02-27', 'count': 67}, {'date': '2023-02-28', 'count': 67}, {'date': '2023-03-01', 'count': 71}, {'date': '2023-03-02', 'count': 55}, {'date': '2023-03-03', 'count': 57}, {'date': '2023-03-04', 'count': 29}, {'date': '2023-03-05', 'count': 26}, {'date': '2023-03-06', 'count': 42}, {'date': '2023-03-07', 'count': 43}, {'date': '2023-03-08', 'count': 62}, {'date': '2023-03-09', 'count': 82}, {'date': '2023-03-10', 'count': 51}, {'date': '2023-03-11', 'count': 28}, {'date': '2023-03-12', 'count': 18}, {'date': '2023-03-13', 'count': 39}, {'date': '2023-03-14', 'count': 46}, {'date': '2023-03-15', 'count': 54}, {'date': '2023-03-16', 'count': 71}, {'date': '2023-03-17', 'count': 67}, {'date': '2023-03-18', 'count': 26}, {'date': '2023-03-19', 'count': 25}, {'date': '2023-03-20', 'count': 55}, {'date': '2023-03-21', 'count': 12}]
            
                # stories_published = rss.source_stories_published_by_day(4415)
                # print(stories_published)
                # returns [{'date': '2001-01-23', 'count': 1}, {'date': '2004-11-11', 'count': 1}, {'date': '2005-04-11', 'count': 1}, {'date': '2006-08-11', 'count': 1}, {'date': '2007-01-26', 'count': 1}, {'date': '2007-09-03', 'count': 1}, {'date': '2008-10-22', 'count': 1}, {'date': '2009-11-10', 'count': 1}, {'date': '2011-09-30', 'count': 1}, {'date': '2012-02-23', 'count': 1}, {'date': '2012-06-15', 'count': 1}, {'date': '2012-06-16', 'count': 1}, {'date': '2012-08-28', 'count': 1}, {'date': '2013-09-12', 'count': 1}, {'date': '2014-08-04', 'count': 1}, {'date': '2014-09-09', 'count': 1}, {'date': '2015-03-06', 'count': 1}, {'date': '2015-04-29', 'count': 1}, {'date': '2015-11-19', 'count': 1}, {'date': '2016-01-05', 'count': 1}, {'date': '2016-05-25', 'count': 1}, {'date': '2017-01-04', 'count': 1}, {'date': '2017-01-31', 'count': 1}, {'date': '2017-04-05', 'count': 1}, {'date': '2018-08-14', 'count': 1}, {'date': '2020-03-27', 'count': 1}, {'date': '2022-08-24', 'count': 1}, {'date': '2022-11-15', 'count': 1}, {'date': '2022-11-18', 'count': 1}, {'date': '2022-11-19', 'count': 1}, {'date': '2022-12-01', 'count': 1}, {'date': '2022-12-02', 'count': 1}, {'date': '2022-12-07', 'count': 1}, {'date': '2022-12-13', 'count': 1}, {'date': '2022-12-15', 'count': 1}, {'date': '2022-12-21', 'count': 1}, {'date': '2022-12-22', 'count': 1}, {'date': '2023-01-19', 'count': 3}, {'date': '2023-01-20', 'count': 5}, {'date': '2023-01-21', 'count': 1}, {'date': '2023-01-23', 'count': 1}, {'date': '2023-01-24', 'count': 1}, {'date': '2023-01-25', 'count': 2}, {'date': '2023-01-26', 'count': 3}, {'date': '2023-01-27', 'count': 2}, {'date': '2023-02-01', 'count': 1}, {'date': '2023-02-02', 'count': 1}, {'date': '2023-02-03', 'count': 2}, {'date': '2023-02-09', 'count': 1}, {'date': '2023-02-16', 'count': 2}, {'date': '2023-02-18', 'count': 1}, {'date': '2023-02-19', 'count': 20}, {'date': '2023-02-20', 'count': 38}, {'date': '2023-02-21', 'count': 40}, {'date': '2023-02-22', 'count': 51}, {'date': '2023-02-23', 'count': 48}, {'date': '2023-02-24', 'count': 45}, {'date': '2023-02-25', 'count': 36}, {'date': '2023-02-26', 'count': 25}, {'date': '2023-02-27', 'count': 48}, {'date': '2023-02-28', 'count': 53}, {'date': '2023-03-01', 'count': 46}, {'date': '2023-03-02', 'count': 37}, {'date': '2023-03-03', 'count': 41}, {'date': '2023-03-04', 'count': 34}, {'date': '2023-03-05', 'count': 14}, {'date': '2023-03-06', 'count': 33}, {'date': '2023-03-07', 'count': 31}, {'date': '2023-03-08', 'count': 41}, {'date': '2023-03-09', 'count': 44}, {'date': '2023-03-10', 'count': 32}, {'date': '2023-03-11', 'count': 22}, {'date': '2023-03-12', 'count': 15}, {'date': '2023-03-13', 'count': 30}, {'date': '2023-03-14', 'count': 30}, {'date': '2023-03-15', 'count': 28}, {'date': '2023-03-16', 'count': 53}, {'date': '2023-03-17', 'count': 54}, {'date': '2023-03-18', 'count': 24}, {'date': '2023-03-19', 'count': 24}, {'date': '2023-03-20', 'count': 37}, {'date': '2023-03-21', 'count': 7}, {'date': None, 'count': 358}]
               
               
                # Generate data (std_dev, mean, etc) from stories_fetched and stories_published
                # do alert check:
                #   if alert:
                #      email += f'source {source_id} (may want to fetch the name) is X standard devs off main, (maybe hyperlink in email)

                # Update the source's stories_per_week in db:
                #   source.stories_per_week = stories published that week (?)
                #   source.save()
        # send_alert_email(email) -> to selected emails

        # with open(file_path) as f:
        #     csv_reader = csv.DictReader(f)
        #     data = pd.DataFrame(csv_reader)
        #     print(data)
        #     data['mean'] = data.groupby('source_id')['count'].rolling(30).mean().reset_index(0, drop=True)
        #     #  standard deviation for each source
        #     data['std_dev'] = data.groupby('source_id')['count'].rolling(30).std().reset_index(0, drop=True)
        #     # Flag sources that have an average of more than 5 stories per day
        #     data['flag'] = np.where(data['mean'] > 5, 1, 0)
        #     # Identify days where a source's number of stories is more than 2 standard deviations below the 30-day average
        #     data['alert'] = np.where(((data['count'] < (data['mean'] - 2*data['std_dev'])) & (data['flag'] == 1)), 1, 0)

        #     for index, row in data.iterrows():
        #         if row['alert'] == 1:
        #             print(row['date'], row['source_id'])
            # for row in csv_reader:
                # try:
                #     source = Source.objects.get(id=int(row['sources_id']))
                #     source.stories_per_week = round((int(float(row['count'])) / 4))
                #     source.save()
                # except ObjectDoesNotExist as e:
                #     logger.error("Unknown source id {}".format(row['media_id']))


        # self.stdout.write(self.style.SUCCESS('Done from "%s"' % file_path))
