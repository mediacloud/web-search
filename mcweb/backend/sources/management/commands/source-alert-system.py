from django.core.management.base import BaseCommand, CommandError
import os
from subprocess import call
import logging

from ...tasks import run_alert_system



logger = logging.getLogger(__name__)



class Command(BaseCommand):
    help = 'Update the stories-per-week for every media source'


    def handle(self, *args, **options):
        print('alert system')
        run_alert_system()
        # if not os.path.exists(file_path):
        #     raise CommandError("Can't find file %s" % file_path)
        # sources = set()
        # # collection_ids = 
        # with open('mcweb/backend/sources/data/collections-to-monitor.json') as collection_ids:
        #     collection_ids = collection_ids.read()
        #     collection_ids = json.loads(collection_ids)
        #     for collection_id in collection_ids:
        #         try:
        #             collection = Collection.objects.get(pk=collection_id)
        #             source_relations = set(collection.source_set.all())
        #             # print(source_relations)
        #             sources = sources | source_relations
        #         except:
        #             print(collection_id)

        # print(collection_ids)
        # Add call to Rss fetcher to get data
        # print(len(sources))
        # with RssFetcherApi() as rss:
        # # #     stories_by_source = rss.stories_by_source() # This will generate tuples with (source_id and stories_per_day)
        # # #         # in the future may want to default to list of source_ids...we have a list of collections that research would like monitored
        # # #         # first pass maybe run through all sources and find high volume sources
          
        # # #     stories_by_source_refined = [source_id for source_id, stories_per_day in stories_by_source if stories_per_day >= 10]
        #     email=""
        #     alert_count = 0
        #     for source in sources:
        #         print(source)
        #         stories_fetched = rss.source_stories_fetched_by_day(source.id) 
        #         # print(stories_fetched)
        #         counts = [d['count'] for d in stories_fetched]  # extract the count values
        #         mean = np.mean(counts) 
        #         std_dev = np.std(counts)  
                # todays_count = counts[-1]

                # stories_published = rss.source_stories_published_by_day(source.id)
                # counts_published = [d['count'] for d in stories_published]  
                # mean_published = np.mean(counts_published)  
                # std_dev_published = np.std(counts_published)  

            #     if (std_dev * 2) < mean:
            #         email += f"Source {source.id}: {source.name} has a story/day average of {mean} over the last 30 days, which is more than two standard deviations (standard_deviation: {std_dev}) above the mean \n"
            #         alert_count += 1
            #         print(email)
            
            # if(email):
            #     email += f"total alert count = {alert_count} \n"
            #     send_alert_email(email)
           
                # Update the source's stories_per_week in db:
                #   source.stories_per_week = stories published that week (?)
                #   source.save()
        # send_alert_email(email) -> to selected emails

