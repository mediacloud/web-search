# mcweb/backend/sources/
from ...metadata_update import UPDATERS
from ...tasks import sources_metadata_update
from ...task_utils import MetadataUpdaterCommand

class Command(MetadataUpdaterCommand):
    help = "Tasks to update the Source table."

    def add_arguments(self, parser):
        updater_names = UPDATERS.keys()
        parser.add_argument(
            "--task", "-T",
            action="append",
            choices=updater_names,
            default=[],
            required=True,
            help="Task(s) to perform",
        )
        super().add_arguments(parser)

    def long_task_name(self, options: dict):
        tasks = options["task"]
        return f"meta-update {','.join(tasks)}"

    def handle(self, *args, **options):
        self.run_task(
            func=sources_metadata_update,
            options=options,
        )
