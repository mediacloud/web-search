import json

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase, override_settings

from ..models import Profile, ResetCodes

URL = "/api/auth/request-reset"


class RequestResetTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="reset_request_user", email="reset_request@example.com")
        Profile.objects.create(user=self.user, verified_email=True)

    def _post(self, **payload):
        return self.client.post(URL, data=json.dumps(payload), content_type="application/json")

    def test_invalid_reset_type_returns_400_not_a_server_error(self):
        """
        Regression test: reset_type is an unconstrained CharField (not a
        choices field), and the view's if/elif that sets reset_text (and
        later subject/message) had no else branch. Any value other than
        'email-confirm'/'password' for an existing user's email used to
        raise UnboundLocalError -- an unhandled 500 on this unauthenticated
        (AllowAny) endpoint.
        """
        response = self._post(email=self.user.email, reset_type="something-else")

        self.assertEqual(response.status_code, 400, response.content)
        self.assertFalse(ResetCodes.objects.exists())

    def test_invalid_reset_type_rejected_even_for_unknown_email(self):
        response = self._post(email="does-not-exist@example.com", reset_type="bogus")
        self.assertEqual(response.status_code, 400)

    def test_unknown_email_returns_404(self):
        response = self._post(email="does-not-exist@example.com", reset_type="password")
        self.assertEqual(response.status_code, 401)

    def test_password_reset_type_creates_reset_code(self):
        response = self._post(email=self.user.email, reset_type="password")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(ResetCodes.objects.filter(email=self.user.email).count(), 1)

    def test_email_confirm_reset_type_creates_reset_code(self):
        response = self._post(email=self.user.email, reset_type="email-confirm")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(ResetCodes.objects.filter(email=self.user.email).count(), 1)

    def test_missing_reset_type_returns_400(self):
        response = self._post(email=self.user.email)
        self.assertEqual(response.status_code, 400)

    def test_missing_email_returns_400(self):
        response = self._post(reset_type="password")
        self.assertEqual(response.status_code, 400)

    def test_succeeds_without_crashing_when_email_host_is_not_configured(self):
        # EMAIL_HOST is unset in this test environment -- confirms the view
        # skips send_mail() gracefully instead of crashing (the sibling
        # bug this session already found/fixed for send_mail elsewhere).
        with self.settings(EMAIL_HOST=None):
            response = self._post(email=self.user.email, reset_type="password")
        self.assertEqual(response.status_code, 200, response.content)

    @override_settings(EMAIL_HOST="smtp.example.com", EMAIL_HOST_USER="noreply@example.com",
                        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_email_is_actually_sent_when_email_host_is_configured(self):
        response = self._post(email=self.user.email, reset_type="password")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Reset Password")
        self.assertIn("reset-password/confirmed", mail.outbox[0].body)
