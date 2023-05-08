from django.core.management.base import BaseCommand
import logging

from ...tasks import run_alert_system



logger = logging.getLogger(__name__)



class Command(BaseCommand):
<<<<<<< HEAD
    help = 'Running source alert system'
=======
    help = 'Schedule the source alert system to run'
>>>>>>> 03f687b1dfc4bce2dd8be2154e594db3386bb6ff


    def handle(self, *args, **options):
        print('alert system')
        run_alert_system()
  

