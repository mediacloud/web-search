"""
Unit tests for every management command that uses TaskCommand (directly, or
via the ScrapeTaskCommand/MetadataUpdaterCommand subclasses):
  scrape-source, scrape-collection, autoscrape, source-tweak-stories-per-week,
  source-alert-system, sources-meta-update.

Each command's actual background-task function is mocked out (via
patch.object on the command module, since these live in hyphenated
filenames that can't be imported with a normal `import` statement -- they're
loaded here with importlib.import_module instead, the same way Django's own
command loader does it). This confirms each command wires up
TaskCommand.run_task correctly -- both the default "run now" path and the
--queue path -- without ever running the real (heavy) scrape/metadata logic.
"""

import importlib
from unittest.mock import MagicMock, patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from ....models import Collection, Source

scrape_source_cmd = importlib.import_module("backend.sources.management.commands.scrape-source")
scrape_collection_cmd = importlib.import_module("backend.sources.management.commands.scrape-collection")
autoscrape_cmd = importlib.import_module("backend.sources.management.commands.autoscrape")
tweak_stories_cmd = importlib.import_module(
    "backend.sources.management.commands.source-tweak-stories-per-week")
alert_system_cmd = importlib.import_module("backend.sources.management.commands.source-alert-system")
meta_update_cmd = importlib.import_module("backend.sources.management.commands.sources-meta-update")


class ScrapeSourceCommandTest(TestCase):
    def setUp(self):
        self.source = Source.objects.create(name="example.com", homepage="http://example.com")

    def test_missing_source_exits_with_error(self):
        with self.assertRaises(SystemExit):
            call_command("scrape-source", 999999, "someone@example.com")

    @patch.object(scrape_source_cmd, "scrape_source")
    def test_default_invocation_runs_the_task_now(self, mock_task):
        call_command("scrape-source", self.source.id, "someone@example.com")

        mock_task.now.assert_called_once()
        mock_task.assert_not_called()
        kwargs = mock_task.now.call_args.kwargs
        self.assertEqual(kwargs["source_id"], self.source.id)
        self.assertEqual(kwargs["homepage"], self.source.homepage)
        self.assertEqual(kwargs["name"], self.source.name)
        self.assertEqual(kwargs["email"], "someone@example.com")

    @patch.object(scrape_source_cmd, "scrape_source")
    def test_queue_invocation_schedules_instead_of_running_now(self, mock_task):
        call_command("scrape-source", self.source.id, "someone@example.com", queue=True)

        mock_task.now.assert_not_called()
        mock_task.assert_called_once()
        self.assertEqual(mock_task.call_args.kwargs["verbose_name"], f"scrape source {self.source.id}")


class ScrapeCollectionCommandTest(TestCase):
    def setUp(self):
        self.collection = Collection.objects.create(name="Scrape Test Collection")

    def test_missing_collection_exits_with_error(self):
        with self.assertRaises(SystemExit):
            call_command("scrape-collection", 999999, "someone@example.com")

    @patch.object(scrape_collection_cmd, "scrape_collection")
    def test_default_invocation_runs_the_task_now(self, mock_task):
        call_command("scrape-collection", self.collection.id, "someone@example.com")

        mock_task.now.assert_called_once()
        mock_task.assert_not_called()
        kwargs = mock_task.now.call_args.kwargs
        self.assertEqual(kwargs["collection_id"], self.collection.id)
        self.assertEqual(kwargs["email"], "someone@example.com")

    @patch.object(scrape_collection_cmd, "scrape_collection")
    def test_queue_invocation_schedules_instead_of_running_now(self, mock_task):
        call_command("scrape-collection", self.collection.id, "someone@example.com", queue=True)

        mock_task.now.assert_not_called()
        mock_task.assert_called_once()


class AutoscrapeCommandTest(TestCase):
    def test_frequency_is_required(self):
        with self.assertRaises(CommandError):
            call_command("autoscrape")

    @patch.object(autoscrape_cmd, "autoscrape")
    def test_default_invocation_runs_the_task_now(self, mock_task):
        call_command("autoscrape", frequency=30)

        mock_task.now.assert_called_once()
        mock_task.assert_not_called()
        options = mock_task.now.call_args.kwargs["options"]
        self.assertEqual(options["frequency"], 30)

    @patch.object(autoscrape_cmd, "autoscrape")
    def test_queue_invocation_schedules_instead_of_running_now(self, mock_task):
        call_command("autoscrape", frequency=30, queue=True)

        mock_task.now.assert_not_called()
        mock_task.assert_called_once()
        self.assertEqual(mock_task.call_args.kwargs["verbose_name"], "autoscrape")


class SourceTweakStoriesPerWeekCommandTest(TestCase):
    @patch.object(tweak_stories_cmd, "tweak_stories_per_week")
    def test_default_invocation_runs_the_task_now(self, mock_task):
        call_command("source-tweak-stories-per-week")

        mock_task.now.assert_called_once()
        mock_task.assert_not_called()
        self.assertFalse(mock_task.now.call_args.kwargs["options"]["update"])

    @patch.object(tweak_stories_cmd, "tweak_stories_per_week")
    def test_update_flag_is_passed_through_in_options(self, mock_task):
        call_command("source-tweak-stories-per-week", update=True)

        self.assertTrue(mock_task.now.call_args.kwargs["options"]["update"])

    @patch.object(tweak_stories_cmd, "tweak_stories_per_week")
    def test_queue_invocation_schedules_instead_of_running_now(self, mock_task):
        call_command("source-tweak-stories-per-week", queue=True)

        mock_task.now.assert_not_called()
        mock_task.assert_called_once()


class SourceAlertSystemCommandTest(TestCase):
    @patch.object(alert_system_cmd, "alert_system")
    def test_default_invocation_runs_the_task_now(self, mock_task):
        call_command("source-alert-system")

        mock_task.now.assert_called_once()
        mock_task.assert_not_called()
        self.assertEqual(mock_task.now.call_args.kwargs["options"]["algorithm"], "both")

    @patch.object(alert_system_cmd, "alert_system")
    def test_queue_invocation_schedules_instead_of_running_now(self, mock_task):
        call_command("source-alert-system", queue=True)

        mock_task.now.assert_not_called()
        mock_task.assert_called_once()
        self.assertEqual(mock_task.call_args.kwargs["verbose_name"], "source alert system")


class SourcesMetaUpdateCommandTest(TestCase):
    def test_task_argument_is_required(self):
        with self.assertRaises(CommandError):
            call_command("sources-meta-update")

    @patch.object(meta_update_cmd, "sources_metadata_update")
    def test_default_invocation_runs_the_task_now(self, mock_task):
        call_command("sources-meta-update", task=["stories_per_week"])

        mock_task.now.assert_called_once()
        mock_task.assert_not_called()
        self.assertEqual(mock_task.now.call_args.kwargs["options"]["task"], ["stories_per_week"])

    @patch.object(meta_update_cmd, "sources_metadata_update")
    def test_queue_invocation_schedules_instead_of_running_now(self, mock_task):
        call_command("sources-meta-update", task=["stories_per_week"], queue=True)

        mock_task.now.assert_not_called()
        mock_task.assert_called_once()
        self.assertEqual(mock_task.call_args.kwargs["verbose_name"], "meta-update stories_per_week")
