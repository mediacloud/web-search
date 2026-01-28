from ....util.tasks import TaskCommand
from ...tasks import tweak_stories_per_week

class Command(TaskCommand):
    help = 'Run after sources-meta-update for stories_per_week and last_story to make sure sources that have searchable stories have non-NULL stories_per_week.'

    def add_arguments(self, parser):
        parser.add_argument("--update", action="store_true",
                            help="Perform update operation (else dry run).")
        super().add_arguments(parser)

    def long_task_name(self, options: dict):
        return "tweak-stories-per-week"

    def handle(self, *args, **options):
        if not options["update"]:
            print("--update not given: will not update rows")

        self.run_task(
            func=tweak_stories_per_week,
            options=options
        )
