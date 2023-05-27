from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class MinimumAmountOfNumbers:
    def __init__(self, minimum_amount_of_numbers=3):
        self.minimum_amount_of_numbers = minimum_amount_of_numbers

    def validate(self, password, user=None):
        count = 0
        for char in password:
            if char.isdigit():
                count+=1

        if count < self.minimum_amount_of_numbers:
            raise ValidationError(
                _("Your password must contain at least %(minimum_amount_of_numbers)d numbers."),
                code="requires_more_numbers",
                params={"minimum_amount_of_numbers": self.minimum_amount_of_numbers},
            )

    def get_help_test(self):
        return _(
            "Your password must contain at least %(minimum_amount_of_numbers)d numbers."
            % {"minimum_amount_of_numbers": self.minimum_amount_of_numbers},
        )


class MinimumAmountOfSpecialCharacters:

    def __init__(self, minimum_amount_of_special_characters=1):
        self.minimum_amount_of_special_characters = minimum_amount_of_special_characters
        self.special_characters = ['!', '@', '$']

    def validate(self, password, user=None):
        
        count = 0
        for char in password: 
            if char in self.special_characters: 
                count+=1 

        if count < self.minimum_amount_of_special_characters:
            raise ValidationError(
                _("Your password must contain at least %(minimum_amount_of_special_characters)d special character: !, @, $"),
                code="requires_more_numbers",
                params={"minimum_amount_of_special_characters": self.minimum_amount_of_special_characters},
            )

    def get_help_test(self):
        return _(
            "Your password must contain at least %(minimum_amount_of_special_characters)d special character: !, @, $"
            % {"minimum_amount_of_special_characters": self.minimum_amount_of_special_characters},
        )
