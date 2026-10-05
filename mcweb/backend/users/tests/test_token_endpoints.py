import json

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token

from ..models import Profile, QuotaHistory


class ResetTokenTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="reset_token_user", password="pw")
        Profile.objects.create(user=self.user, verified_email=True)
        self.client.force_login(self.user)

    def test_reset_token_replaces_the_users_token(self):
        old_token = Token.objects.get(user=self.user)

        response = self.client.post("/api/auth/reset-token")

        self.assertEqual(response.status_code, 200, response.content)
        new_token = Token.objects.get(user=self.user)
        self.assertNotEqual(old_token.key, new_token.key)


class EmailFromTokenTest(TestCase):
    """
    Also exercises _user_from_token: when a lookup token doesn't resolve to
    any user, it returns None rather than raising -- the caller must check
    for that explicitly, since the surrounding try/except here only catches
    exceptions, not a None return.
    """

    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="super_user", email="super@example.com", password="pw")
        Profile.objects.create(user=self.superuser, verified_email=True)
        self.plain_user = User.objects.create_user(username="plain_user", password="pw")
        Profile.objects.create(user=self.plain_user, verified_email=True)
        self.superuser_token = Token.objects.get(user=self.superuser)
        self.plain_user_token = Token.objects.get(user=self.plain_user)

    def _get(self, auth_token, user_token=None):
        params = {"Authorization": f"Token {auth_token}"}
        if user_token is not None:
            params["user"] = f"Token {user_token}"
        return self.client.get(
            "/api/auth/email-from-token", params,
            HTTP_AUTHORIZATION=f"Token {auth_token}")

    def test_superuser_can_look_up_another_users_email_by_token(self):
        response = self._get(self.superuser_token.key, self.plain_user_token.key)

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["email"], self.plain_user.email)

    def test_non_superuser_rejected(self):
        response = self._get(self.plain_user_token.key, self.superuser_token.key)

        self.assertEqual(response.status_code, 403)
        self.assertIn("Must be super user", response.json()["error"])

    def test_superuser_without_user_token_rejected(self):
        response = self._get(self.superuser_token.key)

        self.assertEqual(response.status_code, 403)
        self.assertIn("No user token provided", response.json()["error"])

    def test_no_authorization_param_rejected(self):
        response = self.client.get(
            "/api/auth/email-from-token", HTTP_AUTHORIZATION=f"Token {self.superuser_token.key}")

        self.assertEqual(response.status_code, 403)
        self.assertIn("No token provided", response.json()["error"])

    def test_unresolvable_authorization_token_returns_clean_error_not_a_server_error(self):
        response = self.client.get(
            "/api/auth/email-from-token", {"Authorization": "Token does-not-exist", "user": "Token also-bogus"},
            HTTP_AUTHORIZATION=f"Token {self.superuser_token.key}")

        self.assertEqual(response.status_code, 403, response.content)


class UsersQuotasTokenTest(TestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(username="staff_user", password="pw", is_staff=True)
        Profile.objects.create(user=self.staff_user, verified_email=True)
        self.staff_token = Token.objects.get(user=self.staff_user)
        QuotaHistory.objects.create(
            user=self.staff_user, provider="onlinenews-mediacloud",
            week=QuotaHistory._this_week(), hits=5)

    def test_staff_user_can_list_quotas_via_token(self):
        response = self.client.get(
            "/api/auth/users-quotas", {"Authorization": f"Token {self.staff_token.key}"},
            HTTP_AUTHORIZATION=f"Token {self.staff_token.key}")

        self.assertEqual(response.status_code, 200, response.content)

    def test_unresolvable_token_returns_clean_error_not_a_server_error(self):
        response = self.client.get(
            "/api/auth/users-quotas", {"Authorization": "Token does-not-exist"},
            HTTP_AUTHORIZATION=f"Token {self.staff_token.key}")

        self.assertEqual(response.status_code, 403, response.content)
