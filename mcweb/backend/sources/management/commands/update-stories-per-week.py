from django.core.management.base import BaseCommand
import logging

from ...tasks import update_stories_per_week, sources_task_user

class Command(BaseCommand):
    help = 'Run or queue stories-per-week for all sources update'

    def add_arguments(self, parser):
        # NOTE! test only with no options!!
        parser.add_argument("--update", action="store_true") # write db
        parser.add_argument("--queue", action="store_true") # run from queue

    def handle(self, *args, **options):
        update = options["update"]
        if options["queue"]:
            update_stories_per_week(
                update,
                creator=sources_task_user(),
                verbose_name=f"update stories per week {dt.datetime.utcnow()}"
            )
        else:
            update_stories_per_week.now(update)
