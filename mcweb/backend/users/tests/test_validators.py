from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from ..validators import MinimumAmountOfNumbers, MinimumAmountOfSpecialCharacters


class MinimumAmountOfNumbersTest(SimpleTestCase):
    """
    Wired into AUTH_PASSWORD_VALIDATORS, so this fires on real Django admin
    user-creation/change forms; had no direct test.
    """

    def test_password_with_too_few_numbers_raises(self):
        with self.assertRaises(ValidationError):
            MinimumAmountOfNumbers().validate("only1number")

    def test_password_with_enough_numbers_passes(self):
        MinimumAmountOfNumbers().validate("has123numbers")

    def test_boundary_exact_minimum_passes(self):
        MinimumAmountOfNumbers(minimum_amount_of_numbers=2).validate("ab12cd")

    def test_custom_minimum_is_respected(self):
        validator = MinimumAmountOfNumbers(minimum_amount_of_numbers=5)
        with self.assertRaises(ValidationError):
            validator.validate("only1234")
        validator.validate("has12345digits")

    def test_get_help_text_mentions_the_configured_minimum(self):
        self.assertIn("3", MinimumAmountOfNumbers(minimum_amount_of_numbers=3).get_help_text())


class MinimumAmountOfSpecialCharactersTest(SimpleTestCase):
    def test_password_with_no_special_characters_raises(self):
        with self.assertRaises(ValidationError):
            MinimumAmountOfSpecialCharacters().validate("nospecialchars123")

    def test_password_with_a_special_character_passes(self):
        MinimumAmountOfSpecialCharacters().validate("has1special!")

    def test_custom_minimum_is_respected(self):
        validator = MinimumAmountOfSpecialCharacters(minimum_amount_of_special_characters=2)
        with self.assertRaises(ValidationError):
            validator.validate("only1!")
        validator.validate("has2!!")

    def test_all_documented_special_characters_are_recognized(self):
        validator = MinimumAmountOfSpecialCharacters()
        for char in ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '~', '/', ':', ';']:
            with self.subTest(char=char):
                validator.validate(f"password{char}")

    def test_get_help_text_mentions_the_configured_minimum(self):
        self.assertIn("1", MinimumAmountOfSpecialCharacters(minimum_amount_of_special_characters=1).get_help_text())
