import logging

from django.core.management.base import BaseCommand

from settings import ADMIN_USERNAME

# mcweb/backend/sources/
from ...metadata_update import UPDATERS
from ...tasks import sources_metadata_update
from ...util import ES_PLATFORM, ES_PROVIDER

# mcweb/backend/util/
from ....util.tasks import run_manage_task

class Command(BaseCommand):
    help = "Update the Source table."

    def add_arguments(self, parser):
        parser.add_argument(
            "--provider-name",
            type=str,
            default=ES_PROVIDER,
            help=f"Name of the provider to use (default: {ES_PROVIDER})",
        )

        parser.add_argument(
            "--platform-name",
            type=str,
            default=ES_PLATFORM,
            help=f"Name of the directory platform to use (default: {ES_PLATFORM})",
        )

        parser.add_argument("--queue", action="store_true", help="Queue the task to run in the background.")

        parser.add_argument("--rate", type=int, default=100, help="Max query rate.")

        parser.add_argument("--user", default=ADMIN_USERNAME, help="User to run task under.")

        updater_names = UPDATERS.keys()
        parser.add_argument(
            "--task",
            action="append",
            choices=updater_names,
            default=[],
            required=True,
            help="Task(s) to perform",
        )
        parser.add_argument("--update", action="store_true", help="Perform database updates (else dry run)")

    def handle(self, *args, **options):
        tasks = options["task"]
        run_manage_task(
            func=sources_metadata_update,
            long_task_name=f"meta-update {','.join(tasks)}",
            platform=options["platform_name"],
            provider=options["provider_name"],
            queue=options["queue"],
            rate=options["rate"],
            tasks=tasks,
            update=options["update"],
            username=options["user"],
            verbosity=options["verbosity"])
