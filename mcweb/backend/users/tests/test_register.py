import json

from django.contrib.auth.models import User
from django.test import TestCase

from ..models import Profile

URL = "/api/auth/register"


class RegisterTest(TestCase):
    def _post(self, **payload):
        return self.client.post(URL, data=json.dumps(payload), content_type="application/json")

    def test_successful_registration_creates_user_and_profile(self):
        response = self._post(
            email="new_user@example.com", password1="correct-horse", password2="correct-horse",
            first_name="New", last_name="User", notes="hello")

        self.assertEqual(response.status_code, 200, response.content)
        user = User.objects.get(email="new_user@example.com")
        self.assertEqual(user.username, "new_user@example.com")
        self.assertFalse(user.profile.verified_email)
        self.assertEqual(user.profile.notes, "hello")

    def test_mismatched_passwords_rejected(self):
        response = self._post(email="a@example.com", password1="correct-horse", password2="different")
        self.assertEqual(response.status_code, 403)
        self.assertIn("don't match", response.json()["message"])

    def test_short_password_rejected(self):
        response = self._post(email="a@example.com", password1="short", password2="short")
        self.assertEqual(response.status_code, 403)
        self.assertIn("too short", response.json()["message"])

    def test_invalid_email_rejected(self):
        response = self._post(email="not-an-email", password1="correct-horse", password2="correct-horse")
        self.assertEqual(response.status_code, 403)
        self.assertIn("Invalid email", response.json()["message"])

    def test_duplicate_email_rejected_case_insensitively(self):
        existing = User.objects.create_user(username="existing@example.com", email="Existing@Example.com")
        Profile.objects.create(user=existing, verified_email=True)

        response = self._post(email="existing@example.com", password1="correct-horse", password2="correct-horse")

        self.assertEqual(response.status_code, 403)
        self.assertIn("already exists", response.json()["message"])

    def test_malformed_request_body_returns_clean_400_not_a_server_error(self):
        """
        Regression test: the except-all branch used to call the
        nonexistent `_auth_error_message` (typo for `_auth_err_message`)
        with a positional status arg (the real function's `status` is
        keyword-only), so any exception here -- like unparseable JSON --
        raised a NameError/TypeError instead of returning a clean 400.
        """
        response = self.client.post(URL, data="not json", content_type="application/json")

        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn("message", response.json())
