import datetime as dt

from django.test import TestCase
from django.utils import timezone

from ..misc_tasks import tweak_stories_per_week
from ..models import Source

OPTIONS_BASE = {"user": "system-task"}
TASK_ARGS = {"long_task_name": "tweak-stories-per-week"}


class TweakStoriesPerWeekTest(TestCase):
    """
    tweak_stories_per_week is the real filter/update logic underneath the
    source-tweak-stories-per-week command, which this session already
    tested only by mocking this function away entirely -- the actual query
    logic itself had never run in a test.
    """

    def _source(self, *, platform=Source.SourcePlatforms.ONLINE_NEWS, last_story=None, stories_per_week=None):
        return Source.objects.create(
            name=f"source-{Source.objects.count()}.example.com",
            homepage=f"http://source-{Source.objects.count()}.example.com",
            platform=platform, last_story=last_story, stories_per_week=stories_per_week)

    def _run(self, update: bool):
        tweak_stories_per_week(options={**OPTIONS_BASE, "update": update}, task_args=TASK_ARGS)

    def test_dry_run_does_not_modify_matching_sources(self):
        source = self._source(last_story=timezone.now(), stories_per_week=None)

        self._run(update=False)

        source.refresh_from_db()
        self.assertIsNone(source.stories_per_week)

    def test_update_sets_stories_per_week_to_zero_for_matching_sources(self):
        source = self._source(last_story=timezone.now(), stories_per_week=None)

        self._run(update=True)

        source.refresh_from_db()
        self.assertEqual(source.stories_per_week, 0)

    def test_sources_without_a_last_story_are_left_alone(self):
        source = self._source(last_story=None, stories_per_week=None)

        self._run(update=True)

        source.refresh_from_db()
        self.assertIsNone(source.stories_per_week)

    def test_sources_that_already_have_stories_per_week_are_left_alone(self):
        source = self._source(last_story=timezone.now(), stories_per_week=42)

        self._run(update=True)

        source.refresh_from_db()
        self.assertEqual(source.stories_per_week, 42)

    def test_non_online_news_platforms_are_left_alone(self):
        source = self._source(
            platform=Source.SourcePlatforms.YOUTUBE, last_story=timezone.now(), stories_per_week=None)

        self._run(update=True)

        source.refresh_from_db()
        self.assertIsNone(source.stories_per_week)

    def test_zero_stories_per_week_does_not_match_isnull_filter(self):
        # stories_per_week=0 is not NULL, so it should never be "re-tweaked"
        source = self._source(last_story=timezone.now(), stories_per_week=0)

        self._run(update=True)

        source.refresh_from_db()
        self.assertEqual(source.stories_per_week, 0)
