from rest_framework.test import APITestCase

from ..serializer import SourceSerializer

VALID_DATA = {
    'name': 'testhomepage.com',
    'label': 'testhomepage.com',
    'homepage': 'http://testhomepage.com',
    'platform': 'online_news',
}


class SourceSerializerValidatorsTest(APITestCase):
    """
    validate_name and validate_url_search_string are already covered in
    test_sources.py. This covers the four SourceSerializer validators that
    had zero coverage: validate_homepage, validate_pub_country,
    validate_pub_state, validate_primary_language.
    """

    def test_homepage_must_be_present(self):
        data = {**VALID_DATA, 'homepage': None}
        serializer = SourceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('homepage', serializer.errors)

    def test_homepage_must_start_with_http_or_https(self):
        data = {**VALID_DATA, 'homepage': 'testhomepage.com'}
        serializer = SourceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('homepage', serializer.errors)

    def test_homepage_accepts_https(self):
        data = {**VALID_DATA, 'homepage': 'https://testhomepage.com'}
        serializer = SourceSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_pub_country_accepted(self):
        data = {**VALID_DATA, 'pub_country': 'USA'}
        serializer = SourceSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_pub_country_rejected(self):
        data = {**VALID_DATA, 'pub_country': 'ZZZ'}
        serializer = SourceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('pub_country', serializer.errors)

    def test_valid_pub_state_accepted(self):
        data = {**VALID_DATA, 'pub_state': 'US-MA'}
        serializer = SourceSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_pub_state_rejected(self):
        data = {**VALID_DATA, 'pub_state': 'ZZ-99'}
        serializer = SourceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('pub_state', serializer.errors)

    def test_valid_primary_language_accepted(self):
        data = {**VALID_DATA, 'primary_language': 'en'}
        serializer = SourceSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_primary_language_rejected(self):
        data = {**VALID_DATA, 'primary_language': 'zz'}
        serializer = SourceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('primary_language', serializer.errors)
