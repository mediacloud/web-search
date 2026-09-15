import datetime as dt

import constance
from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import Group, User
from django.test import RequestFactory, TestCase
from django.urls import reverse

from settings import GROUPS

from ..admin import CustomUserAdmin
from ..models import Profile, QuotaHistory

PROVIDER = "onlinenews-mediacloud"


class CustomUserAdminGetQuerysetTest(TestCase):
    """
    CustomUserAdmin.get_queryset composes several non-trivial annotations
    (Subquery/Case/When/Exists/Coalesce/Cast/ExpressionWrapper) to power
    the admin changelist's quota/usage columns. This is exactly the kind
    of ORM code most likely to break silently across a Django version
    bump, and it had zero test coverage.
    """

    def setUp(self):
        self.admin = CustomUserAdmin(User, AdminSite())
        self.request = RequestFactory().get("/admin/auth/user/")
        self.request.user = User.objects.create_superuser(
            username="admin_get_queryset_superuser", email="admin@example.com", password="pw")

    def _annotated(self, user):
        return self.admin.get_queryset(self.request).get(pk=user.pk)

    def test_quota_limit_uses_profile_value_when_set(self):
        user = User.objects.create_user(username="quota_set_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1234)

        self.assertEqual(self._annotated(user).quota_limit, 1234)

    def test_quota_limit_falls_back_to_constance_default_when_unset(self):
        user = User.objects.create_user(username="quota_unset_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=None)

        self.assertEqual(
            self._annotated(user).quota_limit, constance.config.QUOTA_DEFAULT_MEDIA_CLOUD)

    def test_weekly_hits_reflects_current_week_only(self):
        user = User.objects.create_user(username="weekly_hits_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)
        QuotaHistory.objects.create(user=user, provider=PROVIDER, week=QuotaHistory._this_week(), hits=7)
        # a past week's hits must not leak into the current-week count
        QuotaHistory.objects.create(
            user=user, provider=PROVIDER,
            week=QuotaHistory._this_week() - dt.timedelta(weeks=1), hits=99)

        self.assertEqual(self._annotated(user).weekly_hits, 7)

    def test_weekly_hits_is_zero_with_no_quota_history(self):
        user = User.objects.create_user(username="no_history_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)

        self.assertEqual(self._annotated(user).weekly_hits, 0)

    def test_high_rate_limit_true_for_staff(self):
        user = User.objects.create_user(username="staff_hirate_user", password="pw", is_staff=True)
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)

        self.assertTrue(self._annotated(user).high_rate_limit)

    def test_high_rate_limit_true_for_group_member(self):
        user = User.objects.create_user(username="group_hirate_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)
        group, _ = Group.objects.get_or_create(name=GROUPS.HIGH_RATE_LIMIT)
        user.groups.add(group)

        self.assertTrue(self._annotated(user).high_rate_limit)

    def test_high_rate_limit_false_for_plain_user(self):
        user = User.objects.create_user(username="plain_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)

        self.assertFalse(self._annotated(user).high_rate_limit)

    def test_last_use_reflects_most_recent_week_with_hits(self):
        user = User.objects.create_user(username="last_use_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)
        QuotaHistory.objects.create(
            user=user, provider=PROVIDER, week=QuotaHistory._this_week() - dt.timedelta(weeks=2), hits=5)
        newer = QuotaHistory.objects.create(
            user=user, provider=PROVIDER, week=QuotaHistory._this_week() - dt.timedelta(weeks=1), hits=3)
        # a more recent week with ZERO hits must not win over an older week that has hits
        QuotaHistory.objects.create(user=user, provider=PROVIDER, week=QuotaHistory._this_week(), hits=0)

        self.assertEqual(self._annotated(user).last_use, newer.modified_at.date())

    def test_last_use_is_none_with_no_usage(self):
        user = User.objects.create_user(username="no_use_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=1000)

        self.assertIsNone(self._annotated(user).last_use)

    def test_quota_used_pct_computed_from_weekly_hits_and_limit(self):
        user = User.objects.create_user(username="pct_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=200)
        QuotaHistory.objects.create(user=user, provider=PROVIDER, week=QuotaHistory._this_week(), hits=50)

        self.assertEqual(self._annotated(user).quota_used_pct, 25.0)

    def test_quota_used_pct_is_zero_not_a_division_error_when_limit_is_zero(self):
        user = User.objects.create_user(username="zero_limit_user", password="pw")
        Profile.objects.create(user=user, verified_email=True, quota_mediacloud=0)

        self.assertEqual(self._annotated(user).quota_used_pct, 0.0)


class UserAdminChangelistSmokeTest(TestCase):
    """
    Confirms the admin changelist page (which drives get_queryset through
    the real admin view/template stack, not just the annotation directly)
    actually renders. The failure mode that matters most for a Django
    version bump is a silent SQL/annotation break surfacing as a 500 here.
    """

    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="changelist_superuser", email="admin2@example.com", password="pw")
        Profile.objects.create(user=self.superuser, verified_email=True, quota_mediacloud=1000)
        self.client.force_login(self.superuser)

    def test_user_changelist_renders(self):
        # NOTE: mcweb/urls.py mounts admin as path('admin', admin.site.urls)
        # with no trailing slash, so the real URL is "/adminauth/user/", not
        # "/admin/auth/user/" -- reverse() sidesteps that quirk.
        response = self.client.get(reverse("admin:auth_user_changelist"))
        self.assertEqual(response.status_code, 200)
