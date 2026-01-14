# mcweb/backend/sources/
from ...metadata_update import UPDATERS
from ...tasks import sources_metadata_update
from ...util import MetdataUpdaterCommand

class Command(MetdataUpdaterCommand):
    help = "Tasks to update the Source table."

    def add_arguments(self, parser):
        updater_names = UPDATERS.keys()
        parser.add_argument(
            "--task",
            action="append",
            choices=updater_names,
            default=[],
            required=True,
            help="Task(s) to perform",
        )

    def get_long_name(self, **options):
        tasks = options["task"]
        return f"meta-update {','.join(tasks)}"

    def handle(self, *args, **options):
        self.run_task(
            func=sources_metadata_update,
            tasks=options["task"]
        )
