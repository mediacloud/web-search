import six
from django.contrib.auth.tokens import PasswordResetTokenGenerator

# Adapted from https://www.youtube.com/watch?v=Rbkc-0rqSw8 Cryce Truly 

class TokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp: int) -> str:
        return six.text_type(user.pk) + six.text_type(timestamp) + six.text_type(user.profile.registered)

generate_token = TokenGenerator()