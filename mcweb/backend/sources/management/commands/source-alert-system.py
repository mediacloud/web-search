# mcweb/backend/sources/
from ...tasks import alert_system
from ...task_utils import MetadataUpdaterCommand


class Command(MetadataUpdaterCommand):
    help = 'Run or queue the source alert system'

    def add_arguments(self, parser):
        parser.add_argument(
            "--algorithm",
            choices=["legacy", "pelt", "both"],
            default="both",
            help="Alert algorithm mode: legacy thresholds, pelt summaries, or both (default: both).",
        )
        super().add_arguments(parser)

    def long_task_name(self, options: dict):
        return "source alert system"

    def handle(self, *args, **options):
        self.run_task(
            func=alert_system,
            options=options
        )
