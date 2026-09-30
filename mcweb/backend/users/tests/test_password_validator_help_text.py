from django.contrib.auth.models import User
from django.contrib.auth.password_validation import password_validators_help_texts
from django.test import TestCase
from django.urls import reverse

from ..validators import MinimumAmountOfNumbers, MinimumAmountOfSpecialCharacters


class PasswordValidatorHelpTextTest(TestCase):
    """
    Both custom validators in AUTH_PASSWORD_VALIDATORS used to define
    `get_help_test` (typo) rather than the `get_help_text` Django's
    password_validators_help_texts() actually calls. Nothing caught it:
    test_validators.py called the misspelled name too, so the tests passed
    while any page rendering a password field's help text raised
    AttributeError. The admin "Add user" form is the reachable case.

    These tests go through Django's own entry points rather than calling
    the methods by name, so a rename can't silently satisfy them again.
    """

    def test_django_can_collect_help_texts_from_all_configured_validators(self):
        """Calls the same function the password form uses; raised before."""
        texts = password_validators_help_texts()
        self.assertTrue(any("numbers" in t for t in texts), texts)
        self.assertTrue(any("special character" in t for t in texts), texts)

    def test_admin_add_user_page_renders(self):
        """
        The page that actually 500'd: its password field pulls help text
        from every configured validator.
        """
        self.client.force_login(
            User.objects.create_superuser("help_text_su", "a@b.com", "pw"))
        response = self.client.get(reverse("admin:auth_user_add"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "numbers")

    def test_validators_expose_the_name_django_looks_for(self):
        for validator in (MinimumAmountOfNumbers(), MinimumAmountOfSpecialCharacters()):
            with self.subTest(validator=type(validator).__name__):
                self.assertTrue(hasattr(validator, "get_help_text"))
                self.assertFalse(hasattr(validator, "get_help_test"))

    def test_help_text_reports_the_configured_minimum(self):
        self.assertIn(
            "5", MinimumAmountOfNumbers(minimum_amount_of_numbers=5).get_help_text())
        self.assertIn(
            "2",
            MinimumAmountOfSpecialCharacters(
                minimum_amount_of_special_characters=2).get_help_text())
