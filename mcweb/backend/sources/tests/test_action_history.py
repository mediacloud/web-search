"""
Unit tests for backend/sources/action_history.py: log_action,
ActionHistoryContext (contextvars-based parent/child audit linking for bulk
operations), and ActionHistoryViewSetMixin's helper methods. Previously only
exercised as a side effect of other tests (e.g. upload_sources), never
asserted on directly.
"""

from django.contrib.auth.models import AnonymousUser, User
from django.test import TestCase

from ..action_history import ActionHistoryContext, ActionHistoryViewSetMixin, _delegated_history, log_action
from ..models import ActionHistory, Source


class LogActionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="log_action_user", email="log_action@example.com")

    def test_creates_a_record_with_the_given_fields(self):
        record = log_action(
            self.user, "create", ActionHistory.ModelType.SOURCE, object_id=1, object_name="example.com")

        self.assertEqual(record.user, self.user)
        self.assertEqual(record.user_name, "log_action_user")
        self.assertEqual(record.user_email, "log_action@example.com")
        self.assertEqual(record.action_type, "create")
        self.assertEqual(record.object_model, ActionHistory.ModelType.SOURCE)
        self.assertIsNone(record.parent_event)

    def test_anonymous_user_records_no_user_info(self):
        """
        Regression test: user_name/user_email are NOT NULL CharFields, but
        the "no authenticated user" branch left them as None (only `notes`
        had a None->"" guard) -- crashed with IntegrityError before this
        was fixed alongside object_name below.
        """
        record = log_action(AnonymousUser(), "create", ActionHistory.ModelType.SOURCE)

        self.assertIsNone(record.user)
        self.assertEqual(record.user_name, "")
        self.assertEqual(record.user_email, "")

    def test_active_context_sets_parent_and_tracks_child_id(self):
        with ActionHistoryContext(
                user=self.user, action_type="bulk", object_model=ActionHistory.ModelType.COLLECTION,
                object_id=1, object_name="a collection") as ctx:
            child = log_action(
                self.user, "create", ActionHistory.ModelType.SOURCE, object_id=2, object_name="child")

        self.assertEqual(child.parent_event, ctx.parent_event)
        self.assertIn(child.id, ctx.child_event_ids)


class ActionHistoryContextTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="context_user")

    def test_enter_creates_a_parentless_parent_event(self):
        with ActionHistoryContext(
                user=self.user, action_type="bulk_upload_sources",
                object_model=ActionHistory.ModelType.COLLECTION, object_id=1, object_name="Collection") as ctx:
            pass

        self.assertIsNotNone(ctx.parent_event)
        self.assertIsNone(ctx.parent_event.parent_event)

    def test_nested_contexts_restore_the_outer_context_on_exit(self):
        """
        Regression test: __exit__ used to unconditionally reset the
        contextvar to None instead of restoring whatever was active before
        it (via contextvars.Token), so exiting an inner context would
        silently drop an outer one instead of restoring it.
        """
        with ActionHistoryContext(
                user=self.user, action_type="outer", object_model=ActionHistory.ModelType.COLLECTION,
                object_id=1, object_name="outer") as outer_ctx:
            with ActionHistoryContext(
                    user=self.user, action_type="inner", object_model=ActionHistory.ModelType.SOURCE,
                    object_id=2, object_name="inner") as inner_ctx:
                self.assertIs(_delegated_history.get(), inner_ctx)

            # back inside the outer `with` block: outer context must still be active
            self.assertIs(_delegated_history.get(), outer_ctx)

        self.assertIsNone(_delegated_history.get())

    def test_exit_summarizes_child_events_by_action_type_and_object_model(self):
        with ActionHistoryContext(
                user=self.user, action_type="bulk_upload_sources",
                object_model=ActionHistory.ModelType.COLLECTION, object_id=1,
                object_name="Collection", additional_changes={"sources_skipped": 5}) as ctx:
            log_action(self.user, "create", ActionHistory.ModelType.SOURCE, object_id=10)
            log_action(self.user, "create", ActionHistory.ModelType.SOURCE, object_id=11)
            log_action(self.user, "update", ActionHistory.ModelType.FEED, object_id=12)

        ctx.parent_event.refresh_from_db()
        changes = ctx.parent_event.changes
        self.assertEqual(changes["child_event_count"], 3)
        self.assertEqual(changes["summary"], {"create": 2, "update": 1})
        self.assertEqual(changes["by_object_model"], {
            ActionHistory.ModelType.SOURCE: 2, ActionHistory.ModelType.FEED: 1})
        self.assertEqual(sorted(changes["object_ids"]), [10, 11, 12])
        self.assertEqual(changes["sources_skipped"], 5)

    def test_explicit_notes_are_preserved_over_auto_generation(self):
        with ActionHistoryContext(
                user=self.user, action_type="bulk", object_model=ActionHistory.ModelType.COLLECTION,
                object_id=1, object_name="c", notes="my custom notes") as ctx:
            log_action(self.user, "create", ActionHistory.ModelType.SOURCE, object_id=1)

        ctx.parent_event.refresh_from_db()
        self.assertEqual(ctx.parent_event.notes, "my custom notes")

    def test_exception_inside_the_block_still_updates_parent_and_propagates(self):
        with self.assertRaises(ValueError):
            with ActionHistoryContext(
                    user=self.user, action_type="bulk", object_model=ActionHistory.ModelType.COLLECTION,
                    object_id=1, object_name="c") as ctx:
                log_action(self.user, "create", ActionHistory.ModelType.SOURCE, object_id=1)
                raise ValueError("boom")

        self.assertIsNone(_delegated_history.get())
        ctx.parent_event.refresh_from_db()
        self.assertEqual(ctx.parent_event.changes["child_event_count"], 1)


class _FakeSerializer:
    def __init__(self, instance, validated_data, save_result=None):
        self.instance = instance
        self.validated_data = validated_data
        self._save_result = save_result if save_result is not None else instance

    def save(self):
        return self._save_result


class _FakeRequest:
    def __init__(self, user):
        self.user = user


class _SourceViewSet(ActionHistoryViewSetMixin):
    action_history_object_model = ActionHistory.ModelType.SOURCE

    def __init__(self, user):
        self.request = _FakeRequest(user)


class _NoLoggingViewSet(ActionHistoryViewSetMixin):
    action_history_object_model = None

    def __init__(self, user):
        self.request = _FakeRequest(user)


class ActionHistoryViewSetMixinGetChangedFieldsTest(TestCase):
    def setUp(self):
        self.viewset = _SourceViewSet(User.objects.create_user(username="mixin_user2"))

    def test_reports_only_fields_that_actually_changed(self):
        source = Source.objects.create(name="Old Name", homepage="http://example.com", label="Same")
        serializer = _FakeSerializer(source, {"name": "New Name", "label": "Same"})

        changed = self.viewset._get_changed_fields(serializer)

        self.assertEqual(changed, {"name": "Old Name -> New Name"})

class ActionHistoryViewSetMixinCrudLoggingTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="mixin_crud_user")
        self.viewset = _SourceViewSet(self.user)

    def test_perform_create_logs_and_returns_the_saved_instance(self):
        source = Source.objects.create(name="Created Source", homepage="http://example.com")
        serializer = _FakeSerializer(instance=None, validated_data={}, save_result=source)

        result = self.viewset.perform_create(serializer)

        self.assertEqual(result, source)
        record = ActionHistory.objects.get(object_model=ActionHistory.ModelType.SOURCE, action_type="create")
        self.assertEqual(record.object_id, source.id)
        self.assertEqual(record.object_name, "Created Source")

    def test_perform_update_logs_when_fields_changed(self):
        source = Source.objects.create(name="Old Name", homepage="http://example.com")
        serializer = _FakeSerializer(instance=source, validated_data={"name": "New Name"})

        self.viewset.perform_update(serializer)

        record = ActionHistory.objects.get(object_model=ActionHistory.ModelType.SOURCE, action_type="update")
        self.assertEqual(record.changes, {"name": "Old Name -> New Name"})

    def test_perform_update_skips_logging_when_nothing_changed(self):
        source = Source.objects.create(name="Same Name", homepage="http://example.com")
        serializer = _FakeSerializer(instance=source, validated_data={"name": "Same Name"})

        self.viewset.perform_update(serializer)

        self.assertFalse(ActionHistory.objects.filter(action_type="update").exists())

    def test_perform_destroy_logs_before_deleting(self):
        source = Source.objects.create(name="Doomed Source", homepage="http://example.com")
        source_id = source.id

        self.viewset.perform_destroy(source)

        self.assertFalse(Source.objects.filter(id=source_id).exists())
        record = ActionHistory.objects.get(object_model=ActionHistory.ModelType.SOURCE, action_type="delete")
        self.assertEqual(record.object_id, source_id)

    def test_no_object_history_model_skips_logging_entirely(self):
        viewset = _NoLoggingViewSet(self.user)
        source = Source.objects.create(name="Unlogged Source", homepage="http://example.com")
        serializer = _FakeSerializer(instance=None, validated_data={}, save_result=source)

        viewset.perform_create(serializer)

        self.assertFalse(ActionHistory.objects.exists())

    def test_logging_failure_is_swallowed_not_propagated(self):
        from unittest.mock import patch
        source = Source.objects.create(name="Source", homepage="http://example.com")
        serializer = _FakeSerializer(instance=None, validated_data={}, save_result=source)

        with patch("backend.sources.action_history.log_action", side_effect=Exception("boom")):
            self.viewset.perform_create(serializer)  # must not raise
