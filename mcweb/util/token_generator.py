import six
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.models import AbstractBaseUser

# Adapted from https://www.youtube.com/watch?v=Rbkc-0rqSw8 Cryce Truly 

class TokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user: AbstractBaseUser, timestamp: int) -> str:
        return six.text_type(user.pk) + six.text_type(timestamp) + six.text_type(user.registered)

generate_token = TokenGenerator()