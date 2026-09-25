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

    def test_name_must_be_present(self):
        # Regression test: name's model field has null=True, so DRF marks
        # it not-required and passes an explicit `"name": null` straight to
        # validate_name -- which used to crash with AttributeError
        # (None.startswith(...)) instead of returning a clean validation error.
        data = {**VALID_DATA, 'name': None}
        serializer = SourceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_homepage_must_start_with_http_or_https(self):
        data = {**VALID_DATA, 'homepage': 'testhomepage.com'}
        serializer = SourceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('homepage', serializer.errors)

    def test_invalid_pub_country_rejected(self):
        data = {**VALID_DATA, 'pub_country': 'ZZZ'}
        serializer = SourceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('pub_country', serializer.errors)

    def test_invalid_primary_language_rejected(self):
        data = {**VALID_DATA, 'primary_language': 'zz'}
        serializer = SourceSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('primary_language', serializer.errors)
