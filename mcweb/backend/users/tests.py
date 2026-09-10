import json

from django.contrib.auth.models import User
from django.test import TestCase

from backend.users.models import Profile


class AnonymousAccessUsersApiTest(TestCase):
    """
    Confirms these users endpoints actually reject anonymous requests:
    login_required views redirect to Django's login page, DRF views gated
    by IsAuthenticated return 401.
    """

    LOGIN_REQUIRED_URLS = {
        "logout": ("post", "/api/auth/logout"),
        "delete_user": ("delete", "/api/auth/delete-user"),
        "reset_token": ("post", "/api/auth/reset-token"),
    }

    DRF_AUTHENTICATED_URLS = [
        "/api/auth/profile",
        "/api/auth/email-from-token",
        "/api/auth/users-quotas",
    ]

    def test_anonymous_login_required_requests_are_redirected_to_login(self):
        for name, (method, url) in self.LOGIN_REQUIRED_URLS.items():
            with self.subTest(endpoint=name):
                response = getattr(self.client, method)(url)
                self.assertEqual(response.status_code, 302)
                self.assertTrue(response.url.startswith("/sign-in"))

    def test_anonymous_drf_authenticated_requests_are_rejected(self):
        for url in self.DRF_AUTHENTICATED_URLS:
            with self.subTest(endpoint=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 401)


class NonStaffUsersQuotasAccessTest(TestCase):
    """
    Regression test: a logged-in but non-staff user used to crash
    users_quotas with an UnboundLocalError (500) instead of getting a clean
    403, because the view only ever assigned `data` inside the staff/
    superuser branch.
    """

    def setUp(self):
        self.username = "non_staff_user"
        self.password = "correct-horse-battery-staple"
        self.user = User.objects.create_user(
            username=self.username, email="non_staff_user@example.com",
            password=self.password)
        Profile.objects.create(user=self.user, verified_email=True, quota_mediacloud=1000)

        response = self.client.post(
            "/api/auth/login",
            data=json.dumps({"username": self.username, "password": self.password}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200, response.content)

    def test_non_staff_user_gets_forbidden_not_a_server_error(self):
        response = self.client.get("/api/auth/users-quotas")
        self.assertEqual(response.status_code, 403)
