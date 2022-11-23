"""
These function included as utilities as backwards compatabiilty with the legacy system, from which we imported
users. To ensure they did not have to change their passwords, we've included their imported password hashes and at
first login we check against those.
"""

import base64
import hashlib
import logging

logger = logging.getLogger(__name__)

__HASH_SALT_PREFIX = "{SSHA256}"
__HASH_LENGTH = 64  # SHA-256 hash length
__SALT_LENGTH = 64


def password_matches_hash(password: str, password_hash: str) -> bool:
    try:
        password = password.encode('utf-8', errors='replace')  # to concatenate with 'bytes' salt later
        password_hash = password_hash[len(__HASH_SALT_PREFIX):]
        salted_hash_salt = base64.b64decode(password_hash)
        salt = salted_hash_salt[-1 * __SALT_LENGTH:]
        expected_salted_hash = salted_hash_salt[:len(salted_hash_salt) - __SALT_LENGTH]
        actual_password_salt = password + salt
        sha256 = hashlib.sha256()
        sha256.update(actual_password_salt)
        actual_salted_hash = sha256.digest()
        if expected_salted_hash == actual_salted_hash:
            return True
        else:
            return False
    except Exception as ex:
        logger.warning("Failed to validate hash: %s" % str(ex))
        return False


# included mostly for documentation purposes - we shouldn't make our own new hashes
"""
def generate_secure_hash(password: str) -> str:
    password = password.encode('utf-8', errors='replace')
    salt = os.urandom(__SALT_LENGTH)
    password_salt = password + salt
    sha256 = hashlib.sha256()
    sha256.update(password_salt)
    salted_hash = sha256.digest()
    salted_hash_salt = salted_hash + salt
    base64_salted_hash = base64.b64encode(salted_hash_salt).decode('ascii')
    return __HASH_SALT_PREFIX + base64_salted_hash
"""
