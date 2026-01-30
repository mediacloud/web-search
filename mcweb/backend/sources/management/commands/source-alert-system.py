# mcweb/backend/sources/
from ...tasks import alert_system
from ...task_utils import MetadataUpdaterCommand


class Command(MetadataUpdaterCommand):
    help = 'Run or queue the source alert system'

    def long_task_name(self, options: dict):
        return "source alert system"

    def handle(self, *args, **options):
        self.run_task(
            func=alert_system,
            options=options
        )
