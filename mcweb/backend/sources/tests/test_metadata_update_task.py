from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from ..models import MetadataUpdateTask
from ..task_utils import MetadataUpdater

BASECLASS = MetadataUpdateTask.UpdaterClass.METADATA_UPDATER


class MetadataUpdateTaskRunTest(TestCase):
    def test_run_creates_a_new_record(self):
        MetadataUpdateTask.run(baseclass=BASECLASS, subclass="_DummyRunCreate", updated=5)

        task = MetadataUpdateTask.objects.get(baseclass=BASECLASS, subclass="_DummyRunCreate")
        self.assertEqual(task.updated, 5)

    def test_run_updates_the_existing_record_instead_of_duplicating(self):
        MetadataUpdateTask.run(baseclass=BASECLASS, subclass="_DummyRunUpdate", updated=1)
        MetadataUpdateTask.run(baseclass=BASECLASS, subclass="_DummyRunUpdate", updated=2)

        matches = MetadataUpdateTask.objects.filter(baseclass=BASECLASS, subclass="_DummyRunUpdate")
        self.assertEqual(matches.count(), 1)
        self.assertEqual(matches.get().updated, 2)


class LastMetadataUpdatesTest(TestCase):
    def test_maps_each_update_field_to_its_runs_date(self):
        class _DummyMultiField(MetadataUpdater):
            UPDATE_FIELDS = ["field_a", "field_b"]

        MetadataUpdateTask.objects.create(baseclass=BASECLASS, subclass="_DummyMultiField", updated=3)

        result = MetadataUpdateTask._last_metadata_updates()

        today = timezone.now().strftime("%Y-%m-%d")
        self.assertEqual(result["field_a"], today)
        self.assertEqual(result["field_b"], today)

    def test_cached_wrapper_returns_the_same_data_as_the_uncached_method(self):
        cache.clear()

        class _DummyCacheCheck(MetadataUpdater):
            UPDATE_FIELDS = ["cache_check_field"]

        MetadataUpdateTask.objects.create(baseclass=BASECLASS, subclass="_DummyCacheCheck", updated=1)

        self.assertEqual(MetadataUpdateTask.last_metadata_updates(), MetadataUpdateTask._last_metadata_updates())
