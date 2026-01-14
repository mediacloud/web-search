# mcweb/backend/sources/
from ...tasks import alert_system
from ...util import MetadataUpdaterCommand


class Command(MetadataUpdaterCommand):
    help = 'Run or queue the source alert system'

    def long_task_name(self):
        return "source alert system"

    def handle(self, *args, **options):
        self.run_task(
            func=alert_system,
            options=options
        )
