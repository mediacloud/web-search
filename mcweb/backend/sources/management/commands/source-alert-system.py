from django.core.management.base import BaseCommand
import logging

from ...tasks import run_alert_system



logger = logging.getLogger(__name__)



class Command(BaseCommand):
    help = 'Running source alert system'


    def handle(self, *args, **options):
        print('alert system')
        run_alert_system()
  

