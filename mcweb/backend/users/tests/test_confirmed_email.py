import json

from django.contrib.auth.models import Group, User
from django.test import TestCase

from settings import GROUPS

from ..models import Profile, ResetCodes

URL = "/api/auth/email-confirmed"


class ConfirmedEmailTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="confirm_user", email="Confirm_User@Example.com")
        Profile.objects.create(user=self.user, verified_email=False)
        self.reset_code = ResetCodes.objects.create(email=self.user.email, token="valid-token")
        Group.objects.get_or_create(name=GROUPS.API_ACCESS)

    def _post(self, **payload):
        return self.client.post(URL, data=json.dumps(payload), content_type="application/json")

    def test_valid_token_verifies_email_and_grants_api_access(self):
        response = self._post(token="valid-token")

        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.profile.verified_email)
        self.assertTrue(self.user.groups.filter(name=GROUPS.API_ACCESS).exists())

    def test_valid_token_consumes_the_reset_code(self):
        self._post(token="valid-token")
        self.assertFalse(ResetCodes.objects.filter(pk=self.reset_code.pk).exists())

    def test_invalid_token_returns_400(self):
        response = self._post(token="wrong-token")

        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid token", response.json()["error"])
        # nothing should have been consumed for an invalid token
        self.assertTrue(ResetCodes.objects.filter(pk=self.reset_code.pk).exists())

    def test_missing_token_returns_400(self):
        response = self._post()
        self.assertEqual(response.status_code, 400)

    def test_token_with_no_matching_user_does_not_crash(self):
        """
        Regression test: the view has no `else` branch for "token is valid
        but no User matches reset_obj.email" -- it fell through and
        implicitly returned None, which DRF's dispatch() rejects with an
        AssertionError ("Expected a `Response`... but received `NoneType`"),
        an unhandled 500 on this unauthenticated (AllowAny) endpoint.
        """
        orphan_code = ResetCodes.objects.create(email="no-such-user@example.com", token="orphan-token")

        response = self._post(token="orphan-token")

        self.assertEqual(response.status_code, 404, response.content)

    def test_email_matching_is_case_insensitive(self):
        """
        Regression test: matched User by exact `email=` lookup while the
        sibling reset_password/RequestReset endpoints deliberately use
        `email__iexact` to avoid case-sensitivity mismatches (see
        reset_password's comment on this exact issue). A reset code whose
        email casing differs from the stored User.email used to silently
        fail to match.
        """
        differently_cased_code = ResetCodes.objects.create(
            email="confirm_user@example.com", token="case-mismatch-token")

        response = self._post(token="case-mismatch-token")

        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.profile.verified_email)
