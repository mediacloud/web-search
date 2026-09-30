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

class MinimumAmountOfSpecialCharactersTest(SimpleTestCase):
    def test_password_with_no_special_characters_raises(self):
        with self.assertRaises(ValidationError):
            MinimumAmountOfSpecialCharacters().validate("nospecialchars123")

    def test_password_with_a_special_character_passes(self):
        MinimumAmountOfSpecialCharacters().validate("has1special!")

