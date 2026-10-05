from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token


class CreateAuthTokenSignalTest(TestCase):
    """
    create_auth_token (backend/users/models.py) is a post_save receiver on
    User that auto-creates a DRF Token for every new user. It's untested
    but load-bearing for the entire auth system: _serialized_current_user
    does Token.objects.get(user=...) and would 500 if this signal ever
    silently stopped firing (e.g. across a Django version bump changing
    signal dispatch behavior).
    """

    def test_creating_a_user_creates_a_token(self):
        user = User.objects.create_user(username="new_user", password="pw")

        self.assertTrue(Token.objects.filter(user=user).exists())

    def test_saving_an_existing_user_does_not_create_a_duplicate_token(self):
        user = User.objects.create_user(username="existing_user", password="pw")
        original_token = Token.objects.get(user=user).key

        user.email = "changed@example.com"
        user.save()

        self.assertEqual(Token.objects.filter(user=user).count(), 1)
        self.assertEqual(Token.objects.get(user=user).key, original_token)

