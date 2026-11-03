import time

import constance
from django.contrib.auth.models import User
from django.test import TestCase
from mc_providers import UnknownProviderException

from ..exceptions import OverQuotaException
from ..models import Profile, QuotaHistory

MEDIACLOUD = "onlinenews-mediacloud"


class ProfileQuotaForTest(TestCase):
    """
    Profile.quota_for/user_provider_quota gate every /api/search request;
    only ever exercised indirectly (via QuotaHistory rows as fixtures) in
    the search app's own tests, never directly.
    """

    def test_mediacloud_uses_the_configured_value_when_set(self):
        profile = Profile(quota_mediacloud=500)
        self.assertEqual(profile.quota_for(MEDIACLOUD), 500)

    def test_mediacloud_falls_back_to_constance_default_when_unset(self):
        profile = Profile(quota_mediacloud=None)
        self.assertEqual(profile.quota_for(MEDIACLOUD), constance.config.QUOTA_DEFAULT_MEDIA_CLOUD)

    def test_unknown_provider_raises(self):
        profile = Profile(quota_mediacloud=500)
        with self.assertRaises(UnknownProviderException):
            profile.quota_for("some-other-provider")

    def test_user_provider_quota_creates_a_profile_if_missing(self):
        user = User.objects.create_user(username="quota_no_profile_user")
        self.assertFalse(Profile.objects.filter(user=user).exists())

        quota = Profile.user_provider_quota(user.id, MEDIACLOUD)

        self.assertEqual(quota, constance.config.QUOTA_DEFAULT_MEDIA_CLOUD)
        self.assertTrue(Profile.objects.filter(user=user).exists())

class QuotaHistoryCurrentForTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="current_for_user")
        Profile.objects.create(user=self.user, quota_mediacloud=1000)

    def test_creates_a_row_for_the_current_week_if_missing(self):
        row = QuotaHistory.current_for(self.user.id, MEDIACLOUD)

        self.assertEqual(row.week, QuotaHistory._this_week())
        self.assertEqual(row.hits, 0)

    def test_returns_the_existing_row_instead_of_duplicating(self):
        first = QuotaHistory.current_for(self.user.id, MEDIACLOUD)
        first.hits = 5
        first.save()

        second = QuotaHistory.current_for(self.user.id, MEDIACLOUD)

        self.assertEqual(second.pk, first.pk)
        self.assertEqual(second.hits, 5)


class QuotaHistoryCheckQuotaTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="check_quota_user")
        Profile.objects.create(user=self.user, quota_mediacloud=10)

    def test_under_quota_returns_current_hits_without_raising(self):
        QuotaHistory.objects.create(
            user=self.user, provider=MEDIACLOUD, week=QuotaHistory._this_week(), hits=5)

        self.assertEqual(QuotaHistory.check_quota(self.user.id, False, MEDIACLOUD), 5)

    def test_at_quota_raises_for_non_staff(self):
        QuotaHistory.objects.create(
            user=self.user, provider=MEDIACLOUD, week=QuotaHistory._this_week(), hits=10)

        with self.assertRaises(OverQuotaException):
            QuotaHistory.check_quota(self.user.id, False, MEDIACLOUD)


    def test_missing_quota_history_row_is_treated_as_zero_hits(self):
        self.assertEqual(QuotaHistory.check_quota(self.user.id, False, MEDIACLOUD), 0)


class QuotaHistoryIncrementTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="increment_user")
        Profile.objects.create(user=self.user, quota_mediacloud=10)

    def test_new_row(self):
        with QuotaHistory.context(self.user, MEDIACLOUD):
            time.sleep(0.05)

        curr = QuotaHistory.current_for(self.user.id, MEDIACLOUD)
        self.assertEqual(curr.hits, 1)
        self.assertGreaterEqual(curr.ms, 50)

    def test_increment_existing_row(self):
        QuotaHistory.objects.create(
            user=self.user, provider=MEDIACLOUD, week=QuotaHistory._this_week(), hits=1, ms=10)

        with QuotaHistory.context(self.user, MEDIACLOUD):
            time.sleep(0.05)

        curr = QuotaHistory.current_for(self.user.id, MEDIACLOUD)
        self.assertEqual(curr.hits, 2)
        self.assertGreaterEqual(curr.ms, 60)

    def test_increments_hits_by_the_given_amount(self):
        with QuotaHistory.context(self.user, MEDIACLOUD, incr=3):
            pass
        self.assertEqual(QuotaHistory.current_for(self.user.id, MEDIACLOUD).hits, 3)

    def test_up_to_quota(self):
        QuotaHistory.objects.create(
            user=self.user, provider=MEDIACLOUD, week=QuotaHistory._this_week(), hits=9)

        with QuotaHistory.context(self.user, MEDIACLOUD):
            pass

        self.assertEqual(QuotaHistory.current_for(self.user.id, MEDIACLOUD).hits, 10)

    def test_over_quota(self):
        QuotaHistory.objects.create(
            user=self.user, provider=MEDIACLOUD, week=QuotaHistory._this_week(), hits=10)

        with self.assertRaises(OverQuotaException):
            with QuotaHistory.context(self.user, MEDIACLOUD):
                pass

        # error from context __enter__: no increment
        self.assertEqual(QuotaHistory.current_for(self.user.id, MEDIACLOUD).hits, 10)

    def test_crosses_quota(self):
        QuotaHistory.objects.create(
            user=self.user, provider=MEDIACLOUD, week=QuotaHistory._this_week(), hits=9)

        with self.assertRaises(OverQuotaException):
            with QuotaHistory.context(self.user, MEDIACLOUD, incr=2):
                pass

        # error from context __enter__: no increment
        self.assertEqual(QuotaHistory.current_for(self.user.id, MEDIACLOUD).hits, 9)

    def test_staff_bypasses_the_quota_but_still_increments(self):
        QuotaHistory.objects.create(
            user=self.user, provider=MEDIACLOUD, week=QuotaHistory._this_week(), hits=99)

        with QuotaHistory.id_context(self.user.id, True, MEDIACLOUD):
            time.sleep(0.05)

        # still incremented:
        curr = QuotaHistory.current_for(self.user.id, MEDIACLOUD)
        self.assertEqual(curr.hits, 100)
        self.assertGreaterEqual(curr.ms, 50)

    def test_exception_no_increment(self):
        QuotaHistory.objects.create(
            user=self.user, provider=MEDIACLOUD, week=QuotaHistory._this_week(), hits=9)

        with self.assertRaises(Exception):
            with QuotaHistory.context(self.user, MEDIACLOUD, incr=2):
                raise Exception("foo")

        # no increment on exception:
        self.assertEqual(QuotaHistory.current_for(self.user.id, MEDIACLOUD).hits, 9)
