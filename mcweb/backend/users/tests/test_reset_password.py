import json

from django.contrib.auth.models import User
from django.test import TestCase

from ..models import Profile, ResetCodes

URL = "/api/auth/reset-password"


class ResetPasswordTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="reset_user", email="Reset_User@Example.com", password="old-password")
        Profile.objects.create(user=self.user, verified_email=True)
        self.reset_code = ResetCodes.objects.create(email=self.user.email, token="valid-token")

    def _post(self, **payload):
        return self.client.post(URL, data=json.dumps(payload), content_type="application/json")

    def test_successful_reset_updates_password_and_consumes_token(self):
        response = self._post(token="valid-token", new_password="new-password", confirm_password="new-password")

        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new-password"))
        self.assertFalse(ResetCodes.objects.filter(pk=self.reset_code.pk).exists())

    def test_reset_matches_email_case_insensitively(self):
        self.reset_code.email = "reset_user@example.com"
        self.reset_code.save()

        response = self._post(token="valid-token", new_password="new-password", confirm_password="new-password")

        self.assertEqual(response.status_code, 200, response.content)

    def test_invalid_token_rejected(self):
        response = self._post(token="wrong-token", new_password="new-password", confirm_password="new-password")

        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid token", response.json()["error"])

    def test_mismatched_passwords_rejected(self):
        response = self._post(token="valid-token", new_password="new-password", confirm_password="different")

        self.assertEqual(response.status_code, 400)
        self.assertIn("don't match", response.json()["error"])

    def test_short_password_rejected(self):
        response = self._post(token="valid-token", new_password="short", confirm_password="short")

        self.assertEqual(response.status_code, 400)
        self.assertIn("too short", response.json()["error"])

    def test_no_matching_user_returns_404(self):
        self.reset_code.email = "someone-else@example.com"
        self.reset_code.save()

        response = self._post(token="valid-token", new_password="new-password", confirm_password="new-password")

        self.assertEqual(response.status_code, 404)
        self.assertIn("No user found", response.json()["error"])
