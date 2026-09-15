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

    def test_matching_is_case_sensitive(self):
        stored_hash = make_legacy_hash("CaseSensitive")
        self.assertFalse(password_matches_hash("casesensitive", stored_hash))

    def test_different_salts_produce_different_hashes_for_same_password(self):
        hash_a = make_legacy_hash("same password", salt=b"a" * SALT_LENGTH)
        hash_b = make_legacy_hash("same password", salt=b"b" * SALT_LENGTH)
        self.assertNotEqual(hash_a, hash_b)
        self.assertTrue(password_matches_hash("same password", hash_a))
        self.assertTrue(password_matches_hash("same password", hash_b))

    def test_unicode_password_round_trips(self):
        stored_hash = make_legacy_hash("paßwörd\U0001F600")
        self.assertTrue(password_matches_hash("paßwörd\U0001F600", stored_hash))

    def test_malformed_base64_returns_false_not_raises(self):
        # note: the leading "{SSHA256}" characters are stripped
        # unconditionally without checking the prefix is actually present,
        # so this also covers a hash missing that prefix entirely --
        # still safely caught by the broad except, just for the "wrong"
        # reason (bad base64) rather than a clean prefix check.
        self.assertFalse(password_matches_hash("anything", "not valid base64!!"))

    def test_empty_hash_returns_false_not_raises(self):
        self.assertFalse(password_matches_hash("anything", ""))

    def test_truncated_hash_returns_false_not_raises(self):
        # valid base64, but far too short to contain a real hash+salt
        stored_hash = HASH_SALT_PREFIX + base64.b64encode(b"short").decode("ascii")
        self.assertFalse(password_matches_hash("anything", stored_hash))

    def test_none_hash_returns_false_not_raises(self):
        self.assertFalse(password_matches_hash("anything", None))
