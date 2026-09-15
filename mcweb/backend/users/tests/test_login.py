import json

from django.contrib.auth.models import User
from django.test import TestCase

from ..models import Profile
from .test_legacy_password_hash import make_legacy_hash

URL = "/api/auth/login"


class LoginTest(TestCase):
    def _post(self, **payload):
        return self.client.post(URL, data=json.dumps(payload), content_type="application/json")

    def test_successful_login_by_username(self):
        user = User.objects.create_user(username="login_user", password="correct-horse")
        Profile.objects.create(user=user, verified_email=True)

        response = self._post(username="login_user", password="correct-horse")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()["username"], "login_user")

    def test_successful_login_by_email_case_insensitive(self):
        user = User.objects.create_user(
            username="login_user2", email="Login_User2@Example.com", password="correct-horse")
        Profile.objects.create(user=user, verified_email=True)

        response = self._post(username="login_user2@example.com", password="correct-horse")

        self.assertEqual(response.status_code, 200, response.content)

    def test_unverified_email_rejected(self):
        user = User.objects.create_user(username="unverified_user", password="correct-horse")
        Profile.objects.create(user=user, verified_email=False)

        response = self._post(username="unverified_user", password="correct-horse")

        self.assertEqual(response.status_code, 403)
        self.assertIn("not verified", response.json()["message"])

    def test_inactive_user_rejected(self):
        """
        The view has an explicit `elif user.is_active ... else: "Inactive
        user"` branch, but it's actually unreachable: Django's ModelBackend
        already refuses to authenticate an inactive user (returns None), so
        inactive users fall all the way through to the generic "Unable to
        login" branch instead. Still correctly rejected -- just not with
        the message the code appears to promise.
        """
        user = User.objects.create_user(
            username="inactive_user", password="correct-horse", is_active=False)
        Profile.objects.create(user=user, verified_email=True)

        response = self._post(username="inactive_user", password="correct-horse")

        self.assertEqual(response.status_code, 403)
        self.assertIn("Unable to login", response.json()["message"])

    def test_wrong_password_rejected(self):
        user = User.objects.create_user(username="wrong_pw_user", password="correct-horse")
        Profile.objects.create(user=user, verified_email=True)

        response = self._post(username="wrong_pw_user", password="not-the-password")

        self.assertEqual(response.status_code, 403)
        self.assertIn("Unable to login", response.json()["message"])

    def test_unknown_username_rejected(self):
        response = self._post(username="does_not_exist", password="whatever")
        self.assertEqual(response.status_code, 403)

    def test_legacy_password_migrates_on_successful_login(self):
        """
        A pre-Django-auth user has no usable Django password set (empty
        string) and instead has a legacy hash on their profile. First
        login should verify against the legacy hash, then migrate them to
        a normal Django password so future logins use auth.authenticate
        directly.
        """
        user = User.objects.create_user(username="legacy_user", password="correct-horse")
        user.password = ""
        user.save()
        Profile.objects.create(
            user=user, verified_email=True,
            imported_password_hash=make_legacy_hash("legacyplaintextpassword"))

        response = self._post(username="legacy_user", password="legacyplaintextpassword")

        self.assertEqual(response.status_code, 200, response.content)
        user.refresh_from_db()
        self.assertTrue(user.check_password("legacyplaintextpassword"))

    def test_legacy_login_with_wrong_password_rejected(self):
        user = User.objects.create_user(username="legacy_user2", password="correct-horse")
        user.password = ""
        user.save()
        Profile.objects.create(
            user=user, verified_email=True,
            imported_password_hash=make_legacy_hash("legacyplaintextpassword"))

        response = self._post(username="legacy_user2", password="wrong-password")

        self.assertEqual(response.status_code, 403)
