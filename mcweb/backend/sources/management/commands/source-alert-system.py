from django.core.management.base import BaseCommand

from ...tasks import alert_system, sources_task_user

class Command(BaseCommand):
    help = 'Run or queue the source alert system'

    def add_arguments(self, parser):
        parser.add_argument("--queue", action="store_true")  # run from queue
        parser.add_argument("--update", action="store_true") # write db

    def handle(self, *args, **options):
        update = options["update"]
        if options["queue"]:
            alert_system(
                update,
                creator=sources_task_user(),
                verbose_name=f"source alert system {dt.datetime.utcnow()}"
            )
        else:
            alert_system.now(update)
