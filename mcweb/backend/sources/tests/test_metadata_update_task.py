from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from ..models import MetadataUpdateTask, METADATA_UPDATER_CLASS_TO_FIELDS
from ..task_utils import MetadataUpdater

BASECLASS = MetadataUpdateTask.UpdaterClass.METADATA_UPDATER


class MetadataUpdaterMetaclassTest(TestCase):
    """
    MetadataUpdaterMetaclass builds a name->UPDATE_FIELDS registry as a side
    effect of class *definition* (not instantiation), used by
    MetadataUpdateTask to report per-field last-run dates. Metaclass
    machinery like this is exactly the kind of thing that can shift subtly
    across Python versions, and it had no direct test.
    """

    def test_subclass_with_update_fields_is_registered_by_name(self):
        class _DummyUpdaterWithFields(MetadataUpdater):
            UPDATE_FIELDS = ["dummy_field"]

        self.assertEqual(METADATA_UPDATER_CLASS_TO_FIELDS["_DummyUpdaterWithFields"], ["dummy_field"])

    def test_subclass_without_its_own_update_fields_inherits_parents_under_its_own_name(self):
        class _DummyBase(MetadataUpdater):
            UPDATE_FIELDS = ["inherited_field"]

        class _DummyChild(_DummyBase):
            pass

        # getattr() walks the MRO, so a subclass that doesn't set its own
        # UPDATE_FIELDS still gets registered -- under ITS OWN name -- with
        # whatever it inherited from its parent.
        self.assertEqual(METADATA_UPDATER_CLASS_TO_FIELDS["_DummyChild"], ["inherited_field"])

    def test_base_class_without_update_fields_is_not_registered(self):
        # MetadataUpdater itself only *annotates* UPDATE_FIELDS
        # (`UPDATE_FIELDS: list[str]`), it never assigns it.
        self.assertNotIn("MetadataUpdater", METADATA_UPDATER_CLASS_TO_FIELDS)


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


class ClassSubclassToFieldsTest(TestCase):
    def test_looks_up_registered_fields_by_subclass_name(self):
        class _DummyForLookup(MetadataUpdater):
            UPDATE_FIELDS = ["looked_up_field"]

        fields = MetadataUpdateTask._class_subclass_to_fields(BASECLASS, "_DummyForLookup")

        self.assertEqual(fields, ["looked_up_field"])

    def test_asserts_on_unsupported_baseclass(self):
        with self.assertRaises(AssertionError):
            MetadataUpdateTask._class_subclass_to_fields("NotARealBaseclass", "whatever")


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
