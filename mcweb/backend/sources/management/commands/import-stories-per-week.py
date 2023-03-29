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
from util.send_emails import send_alert_email

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
            stories_by_source = rss.stories_by_source() # This will generate tuples with (source_id and stories_per_day)
                # in the future may want to default to list of source_ids...we have a list of collections that research would like monitored
                # first pass maybe run through all sources and find high volume sources
          
            stories_by_source_refined = [source_id for source_id, stories_per_day in stories_by_source if stories_per_day >= 10]
            email=""
            for source_id in stories_by_source_refined:
                stories_fetched = rss.source_stories_fetched_by_day(source_id) 
                # print(stories_fetched)
                
                source = Source.objects.get(pk=source_id)
                counts = [d['count'] for d in stories_fetched]  # extract the count values
                mean = np.mean(counts) 
                std_dev = np.std(counts)  
                todays_count = counts[-1]

                stories_published = rss.source_stories_published_by_day(source_id)
                counts_published = [d['count'] for d in stories_published]  
                mean_published = np.mean(counts_published)  
                std_dev_published = np.std(counts_published)  

                if (std_dev * 2) > mean :
                    email += f"Source {source_id}: {source.name} has a mean of {mean}, which is more than two standard deviations ({std_dev}) above the mean \n"
            
            if(email):
                print(email)
                send_alert_email(email)
           
                # Update the source's stories_per_week in db:
                #   source.stories_per_week = stories published that week (?)
                #   source.save()
        # send_alert_email(email) -> to selected emails

        
      
            # for row in csv_reader:
                # try:
                #     source = Source.objects.get(id=int(row['sources_id']))
                #     source.stories_per_week = round((int(float(row['count'])) / 4))
                #     source.save()
                # except ObjectDoesNotExist as e:
                #     logger.error("Unknown source id {}".format(row['media_id']))


        # self.stdout.write(self.style.SUCCESS('Done from "%s"' % file_path))
