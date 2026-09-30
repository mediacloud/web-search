import base64
import hashlib

from django.test import SimpleTestCase

from ..legacy import password_matches_hash

HASH_SALT_PREFIX = "{SSHA256}"
SALT_LENGTH = 64


def make_legacy_hash(password: str, salt: bytes = b"s" * SALT_LENGTH) -> str:
    """
    Mirrors the commented-out `generate_secure_hash` in legacy.py (kept
    there only for documentation, since new hashes shouldn't be minted
    this way) -- used here to build valid fixtures to test
    password_matches_hash's decoding side against.
    """
    sha256 = hashlib.sha256()
    sha256.update(password.encode("utf-8") + salt)
    salted_hash_salt = sha256.digest() + salt
    return HASH_SALT_PREFIX + base64.b64encode(salted_hash_salt).decode("ascii")


class PasswordMatchesHashTest(SimpleTestCase):
    """
    password_matches_hash (backend/users/legacy.py) verifies passwords for
    users imported from the legacy system, used as a fallback in the login
    view when normal Django auth fails. Untested despite being
    security-critical and sitting directly on the login path.
    """

    def test_correct_password_matches(self):
        stored_hash = make_legacy_hash("correct horse battery staple")
        self.assertTrue(password_matches_hash("correct horse battery staple", stored_hash))

    def test_wrong_password_does_not_match(self):
        stored_hash = make_legacy_hash("correct horse battery staple")
        self.assertFalse(password_matches_hash("wrong password", stored_hash))

    def test_malformed_base64_returns_false_not_raises(self):
        # note: the leading "{SSHA256}" characters are stripped
        # unconditionally without checking the prefix is actually present,
        # so this also covers a hash missing that prefix entirely --
        # still safely caught by the broad except, just for the "wrong"
        # reason (bad base64) rather than a clean prefix check.
        self.assertFalse(password_matches_hash("anything", "not valid base64!!"))

