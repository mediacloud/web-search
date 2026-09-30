"""
management command to run the live-ES/live-network integration test
suites (see backend/util/integration_test_utils.py)

Doesn't REALLY belong under "sources" -- the suites it runs live under
both backend/search/integration_tests and backend/sources/integration_tests
-- but there's no single app that owns cross-cutting commands, and this
one is closest in spirit to sources-meta-update.py etc.
"""
import os
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand

import settings


class Command(BaseCommand):
    help = (
        "Run the live-ES/live-network integration test suites. Unlike "
        "plain `manage.py test`, this sets RUN_INTEGRATION_TESTS=1 "
        "automatically and auto-discovers every backend/*/integration_tests "
        "package, so newly added integration test suites are picked up "
        "without editing this command. Requires a real ES backend "
        "reachable (see ONLINE_NEWS_MEDIA_CLOUD_PROVIDER_BASE_URL) and "
        "runs against the normal local/scratch Postgres test database."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "labels", nargs="*",
            help="Specific test labels to run, as with `manage.py test` "
                 "(e.g. backend.sources.integration_tests.test_live_rescrape). "
                 "Defaults to every discovered backend/*/integration_tests package.",
        )

    def handle(self, *args, **options):
        os.environ["RUN_INTEGRATION_TESTS"] = "1"

        labels = options["labels"] or self._discover_integration_test_labels()
        if not labels:
            self.stderr.write("no integration_tests packages found under backend/")
            return

        self.stdout.write("running: " + " ".join(labels))
        call_command("test", *labels, verbosity=options["verbosity"], interactive=False)

    def _discover_integration_test_labels(self) -> list[str]:
        labels = []
        for path in sorted(Path(settings.BASE_DIR).glob("backend/*/integration_tests")):
            if (path / "__init__.py").exists():
                app = path.parent.name
                labels.append(f"backend.{app}.integration_tests")
        return labels
