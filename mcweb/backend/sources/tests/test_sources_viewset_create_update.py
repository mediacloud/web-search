from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ...users.models import Profile
from ..models import ActionHistory, Source


class SourcesViewSetCreateUpdateTest(APITestCase):
    """
    SourcesViewSet.create/partial_update are hand-rolled overrides (not
    DRF's defaults) with no prior coverage. One real quirk is pinned down
    here rather than fixed: create() raises a bare APIException (-> 500)
    instead of a clean 400 on validation failure.

    partial_update's missing `partial=True` *was* a second such quirk --
    found and fixed when upgrading to Django 4.2/DRF 3.17 surfaced it as a
    hard test failure (validate_name crashed on the now-uncaught AttributeError
    instead of the exception being silently converted to a 500 response, which
    is how the test client used to mask it).
    """

    URL = "/api/sources/sources/"

    def setUp(self):
        self.staff_user = User.objects.create_user(
            username="sources_crud_staff", password="pw", is_staff=True)
        Profile.objects.create(user=self.staff_user, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.staff_user)

        self.source = Source.objects.create(
            name="example.com", homepage="http://example.com", label="example.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

    def _detail_url(self, source=None):
        return f"{self.URL}{(source or self.source).id}/"

    # -- create() --

    def test_create_derives_name_from_domain_and_label_from_name(self):
        response = self.client.post(self.URL, {
            "homepage": "http://newexample.com",
            "domain": "newexample.com",
        }, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        source_data = response.data["source"]
        self.assertEqual(source_data["name"], "newexample.com")
        self.assertEqual(source_data["label"], "newexample.com")

        created_history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.SOURCE, object_id=source_data["id"], action_type="create").first()
        self.assertIsNotNone(created_history)

    def test_create_derives_name_from_homepage_when_domain_omitted(self):
        response = self.client.post(self.URL, {
            "homepage": "http://anotherexample.com",
        }, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["source"]["name"], "anotherexample.com")

    def test_create_uses_explicit_label_when_given(self):
        response = self.client.post(self.URL, {
            "homepage": "http://labeledexample.com",
            "domain": "labeledexample.com",
            "label": "A Nicer Label",
        }, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["source"]["label"], "A Nicer Label")

    def test_create_missing_homepage_is_currently_an_unhandled_500(self):
        # Source._clean_source returns None when homepage is missing, and
        # SourcesViewSet.create raises a bare APIException (not
        # ValidationError) in that case, which DRF surfaces as a 500.
        response = self.client.post(self.URL, {"domain": "example.com"}, format="json")
        self.assertEqual(response.status_code, 500)

    def test_create_invalid_data_is_currently_an_unhandled_500(self):
        # same homepage/domain as the Source created in setUp -> validate_name's
        # duplicate-name check fails -> APIException (not ValidationError)
        # -> 500, not a clean 400.
        response = self.client.post(self.URL, {
            "homepage": "http://example.com",
            "domain": "example.com",
        }, format="json")
        self.assertEqual(response.status_code, 500)

    # -- partial_update() --

    def test_partial_update_with_only_changed_field_succeeds(self):
        response = self.client.patch(self._detail_url(), {"notes": "just a note"}, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.source.refresh_from_db()
        self.assertEqual(self.source.notes, "just a note")
        # untouched fields must survive a true partial update
        self.assertEqual(self.source.name, "example.com")
        self.assertEqual(self.source.homepage, "http://example.com")

    def test_partial_update_with_full_payload_succeeds_and_logs_history(self):
        response = self.client.patch(self._detail_url(), {
            "homepage": self.source.homepage,
            "name": self.source.name,
            "label": self.source.label,
            "platform": self.source.platform,
            "notes": "updated via full payload",
        }, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.source.refresh_from_db()
        self.assertEqual(self.source.notes, "updated via full payload")

        update_history = ActionHistory.objects.filter(
            object_model=ActionHistory.ModelType.SOURCE, object_id=self.source.id, action_type="update").first()
        self.assertIsNotNone(update_history)
        self.assertIn("notes", update_history.changes)

    # -- default update() (PUT), for comparison with the hand-rolled partial_update --

    def test_full_update_via_put_succeeds(self):
        response = self.client.put(self._detail_url(), {
            "homepage": self.source.homepage,
            "name": self.source.name,
            "label": self.source.label,
            "platform": self.source.platform,
            "notes": "updated via PUT",
        }, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.source.refresh_from_db()
        self.assertEqual(self.source.notes, "updated via PUT")
