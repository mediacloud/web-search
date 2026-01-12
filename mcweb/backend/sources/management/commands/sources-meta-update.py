import logging

from django.core.management.base import BaseCommand

from settings import ADMIN_USERNAME
from ...tasks import metadata_update, UPDATERS
from ....util.tasks import run_manage_task

DEF_PROVIDER = "onlinenews-mediacloud"
DEF_PLATFORM = "online_news"

class Command(BaseCommand):
    help = "Update the Source table."

    def add_arguments(self, parser):
        parser.add_argument(
            "--provider-name",
            type=str,
            default=DEF_PROVIDER,
            help=f"Name of the provider to use (default: {DEF_PROVIDER})",
        )

        parser.add_argument(
            "--platform-name",
            type=str,
            default=DEF_PLATFORM,
            help=f"Name of the directory platform to use (default: {DEF_PLATFORM})",
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
            func=metadata_update,
            long_task_name=f"meta-update {','.join(tasks)}",
            platform=options["platform_name"],
            provider=options["provider_name"],
            queue=options["queue"],
            rate=options["rate"],
            tasks=tasks,
            update=options["update"],
            username=options["user"],
            verbosity=options["verbosity"])
