from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from ...users.models import Profile
from ..models import Source


class SourcesViewSetPermissionsTest(APITestCase):
    """
    SourcesViewSet write access is gated purely on is_staff/is_superuser --
    unlike Collections, there's no per-object "contributor" tier for
    Sources. Only anonymous-401-on-list was tested before; this pins down
    the full anonymous/non-staff/staff matrix across every verb.
    """

    URL = "/api/sources/sources/"

    def setUp(self):
        self.source = Source.objects.create(
            name="example.com", homepage="http://example.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

        self.staff_user = User.objects.create_user(
            username="sources_staff", password="pw", is_staff=True)
        self.non_staff_user = User.objects.create_user(
            username="sources_contributor", password="pw")
        # retrieve() does a quota check/increment; quota_mediacloud set
        # explicitly so it doesn't fall back to constance.config (which
        # needs a live Redis connection)
        for user in (self.staff_user, self.non_staff_user):
            Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)

    def _detail_url(self):
        return f"{self.URL}{self.source.id}/"

    def test_anonymous_is_rejected_on_every_verb(self):
        self.assertEqual(self.client.get(self.URL).status_code, 401)
        self.assertEqual(self.client.get(self._detail_url()).status_code, 401)
        self.assertEqual(
            self.client.post(self.URL, {"homepage": "http://new.com", "name": "new.com"}, format="json").status_code,
            401)
        self.assertEqual(
            self.client.put(self._detail_url(), {"homepage": "http://x.com"}, format="json").status_code, 401)
        self.assertEqual(
            self.client.patch(self._detail_url(), {"notes": "x"}, format="json").status_code, 401)
        self.assertEqual(self.client.delete(self._detail_url()).status_code, 401)

    def test_non_staff_can_read_but_not_write(self):
        self.client.force_login(self.non_staff_user)

        self.assertEqual(self.client.get(self.URL).status_code, 200)
        self.assertEqual(self.client.get(self._detail_url()).status_code, 200)

        self.assertEqual(
            self.client.post(self.URL, {"homepage": "http://new.com", "name": "new.com"}, format="json").status_code,
            403)
        self.assertEqual(
            self.client.put(self._detail_url(), {"homepage": "http://x.com"}, format="json").status_code, 403)
        self.assertEqual(
            self.client.patch(self._detail_url(), {"notes": "x"}, format="json").status_code, 403)
        self.assertEqual(self.client.delete(self._detail_url()).status_code, 403)

        self.source.refresh_from_db()
        self.assertEqual(self.source.homepage, "http://example.com")

    def test_staff_can_read_and_write(self):
        self.client.force_login(self.staff_user)

        self.assertEqual(self.client.get(self.URL).status_code, 200)
        self.assertEqual(self.client.get(self._detail_url()).status_code, 200)

        create_resp = self.client.post(self.URL, {
            "homepage": "http://staffcreated.com",
            "domain": "staffcreated.com",
            "platform": "online_news",
        }, format="json")
        self.assertEqual(create_resp.status_code, 200, create_resp.content)

        self.assertEqual(self.client.delete(self._detail_url()).status_code, 204)
