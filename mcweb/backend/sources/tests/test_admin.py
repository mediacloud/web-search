from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import User
from django.test import RequestFactory, TestCase
from django.urls import reverse

from ..admin import ActionHistoryAdmin, CollectionAdmin, IsParentEventFilter, SourceAdmin
from ..models import ActionHistory, Collection, Source


class AdminChangelistSmokeTest(TestCase):
    """
    CollectionAdmin/SourceAdmin/ActionHistoryAdmin are mostly declarative
    (list_display/search_fields/list_filter), so the main Django-version-bump
    risk is a changelist page silently 500ing. Confirms each renders.
    """

    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="sources_admin_superuser", email="admin@example.com", password="pw")
        self.client.force_login(self.superuser)

    def test_collection_changelist_renders(self):
        Collection.objects.create(name="Admin Test Collection")
        response = self.client.get(reverse("admin:sources_collection_changelist"))
        self.assertEqual(response.status_code, 200)

    def test_source_changelist_renders(self):
        Source.objects.create(name="example.com", homepage="http://example.com")
        response = self.client.get(reverse("admin:sources_source_changelist"))
        self.assertEqual(response.status_code, 200)

    def test_action_history_changelist_renders(self):
        ActionHistory.objects.create(
            action_type="create", object_model=ActionHistory.ModelType.SOURCE,
            object_id=1, object_name="example.com")
        response = self.client.get(reverse("admin:sources_actionhistory_changelist"))
        self.assertEqual(response.status_code, 200)


class IsParentEventFilterTest(TestCase):
    """Confirms the parent/child SimpleListFilter actually narrows the queryset."""

    def setUp(self):
        self.parent = ActionHistory.objects.create(
            action_type="upload_sources", object_model=ActionHistory.ModelType.SOURCE,
            object_id=1, object_name="parent event")
        self.child = ActionHistory.objects.create(
            action_type="create", object_model=ActionHistory.ModelType.SOURCE,
            object_id=2, object_name="child event", parent_event=self.parent)
        self.admin = ActionHistoryAdmin(ActionHistory, AdminSite())
        self.request = RequestFactory().get("/adminauth/sources/actionhistory/")

    def _filtered(self, value):
        # Django >=5.0 builds filter params from request.GET.lists(), so each
        # value is a list and SimpleListFilter takes its last element.
        filter_ = IsParentEventFilter(self.request, {'event_type': [value]}, ActionHistory, self.admin)
        return set(filter_.queryset(self.request, ActionHistory.objects.all()))

    def test_parent_filter_returns_only_parent_events(self):
        self.assertEqual(self._filtered('parent'), {self.parent})

    def test_child_filter_returns_only_child_events(self):
        self.assertEqual(self._filtered('child'), {self.child})
