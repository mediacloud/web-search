"""
Unit tests for util/ratelimit_callables.query_rate: real branching logic
that gates rate limits on all /api/search endpoints (session-authenticated
web UI calls -> unlimited, staff/high-rate-limit group -> 100/m, everyone
else -> 2/m). Security-relevant, had no coverage.
"""

from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth.models import Group, User
from django.test import TestCase
from rest_framework.authentication import SessionAuthentication, TokenAuthentication

from settings import GROUPS

from .ratelimit_callables import query_rate


def _request(*, authenticator, user):
    return SimpleNamespace(successful_authenticator=authenticator, user=user)


class QueryRateTest(TestCase):
    def test_session_authenticated_requests_are_unlimited(self):
        # covers the anti-spoofing fix noted in the source comment: this
        # checks the authenticator DRF actually used, not a raw cookie
        result = query_rate("group", _request(
            authenticator=SessionAuthentication(), user=User(is_staff=False)))
        self.assertIsNone(result)

    def test_staff_user_gets_the_high_rate(self):
        user = User.objects.create_user(username="staff_ratelimit_user", is_staff=True)
        result = query_rate("group", _request(authenticator=TokenAuthentication(), user=user))
        self.assertEqual(result, "100/m")

    def test_high_rate_limit_group_member_gets_the_high_rate(self):
        user = User.objects.create_user(username="group_ratelimit_user")
        group, _ = Group.objects.get_or_create(name=GROUPS.HIGH_RATE_LIMIT)
        user.groups.add(group)

        result = query_rate("group", _request(authenticator=TokenAuthentication(), user=user))

        self.assertEqual(result, "100/m")

    def test_plain_user_gets_the_low_rate(self):
        user = User.objects.create_user(username="plain_ratelimit_user")
        result = query_rate("group", _request(authenticator=TokenAuthentication(), user=user))
        self.assertEqual(result, "2/m")

    def test_staff_check_short_circuits_before_the_group_database_query(self):
        # per the source comment: staff is checked first specifically to
        # avoid a database hit for the common staff case
        user = User.objects.create_user(username="staff_short_circuit_user", is_staff=True)

        with patch.object(user.groups, "filter", side_effect=AssertionError(
                "groups.filter() should not be called for a staff user")):
            result = query_rate("group", _request(authenticator=TokenAuthentication(), user=user))

        self.assertEqual(result, "100/m")

    def test_no_authenticator_falls_through_to_staff_group_check(self):
        user = User.objects.create_user(username="no_auth_ratelimit_user")
        result = query_rate("group", _request(authenticator=None, user=user))
        self.assertEqual(result, "2/m")
