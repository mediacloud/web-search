from rest_framework.test import APITestCase
from rest_framework.exceptions import ValidationError
from ..models import Source
from ..serializer import SourceSerializer

class SourceSerializerTest(APITestCase):

    def setUp(self):
        self.valid_data = {
            'name': 'testhomepage.com',
            'url_search_string': 'testurlsearchstring.com/test/*',
            'label': 'testhomepage.com',
            'homepage': 'http://testhomepage.com',
            'notes': 'Test notes',
            'platform': Source.SourcePlatforms.ONLINE_NEWS,
        }

        self.invalid_data = {
            'name': 'http://testwrongname.com',
            'url_search_string': 'http://testurlsearchstring.com/test/*',
            'notes': 'Test bad url_search_string',
            'homepage': 'http://testurlsearchstring.com',
            'platform': Source.SourcePlatforms.ONLINE_NEWS,
        }

    def test_valid_source_serializer(self):
        serializer = SourceSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], self.valid_data['name'])
        self.assertEqual(serializer.validated_data['url_search_string'], self.valid_data['url_search_string'])

    def test_invalid_source_serializer(self):
        serializer = SourceSerializer(data=self.invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
        self.assertIn('url_search_string', serializer.errors)

    def test_create_source(self):
        serializer = SourceSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        source = serializer.save()
        self.assertEqual(source.name, self.valid_data['name'])
        self.assertEqual(source.url_search_string, self.valid_data['url_search_string'])

    def test_create_source_with_existing_name(self):
        Source.objects.create(**self.valid_data)
        serializer = SourceSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_create_source_with_existing_url_search_string(self):
        Source.objects.create(**self.valid_data)
        self.valid_data['name'] = 'newname.com'
        serializer = SourceSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('url_search_string', serializer.errors)
