from django.core.management.base import BaseCommand
import logging

from ...tasks import update_stories_per_week



logger = logging.getLogger(__name__)



class Command(BaseCommand):
    help = 'Update the stories-per-week for every media source in rss fetcher'


    def handle(self, *args, **options):
        logger.info("====starting update stories task")
        update_stories_per_week()