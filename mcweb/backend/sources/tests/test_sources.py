from rest_framework.test import APITestCase
from rest_framework.exceptions import ValidationError
from ..models import Source
from ..serializer import SourceSerializer

class SourceSerializerTest(APITestCase):

    def setUp(self):
        self.valid_data = {
            'name': 'testhomepage.com',
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

        # self.assertEqual(serializer.validated_data['url_search_string'], self.valid_data['url_search_string'])


    def test_create_source(self):
        serializer = SourceSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        source = serializer.save()
        self.assertEqual(source.name, self.valid_data['name'])
        # valid_data never sets url_search_string, so it should be unset on the new Source
        self.assertIsNone(source.url_search_string)

    def test_create_source_with_existing_name(self):
        # valid_data has no url_search_string, so a second Source with the same
        # name (and no url_search_string) is a plain duplicate.
        Source.objects.create(**self.valid_data)
        serializer = SourceSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_create_source_with_existing_url_search_string(self):
        # Sources scoped to a url_search_string may share a name/homepage with
        # other Sources (e.g. different sections of the same site), so this
        # must reuse the same url_search_string to be a genuine duplicate --
        # changing only the name (as this test previously did) doesn't
        # exercise url_search_string uniqueness at all.
        data_with_uss = {**self.valid_data, 'url_search_string': 'testhomepage.com/*'}
        Source.objects.create(**data_with_uss)
        serializer = SourceSerializer(data=data_with_uss)
        self.assertFalse(serializer.is_valid())
        self.assertIn('url_search_string', serializer.errors)

    def test_different_url_search_string_same_name_is_not_a_duplicate(self):
        # Two Sources may share a name/homepage as long as their
        # url_search_string differs (e.g. different sections of the same
        # site) -- validate_name must only enforce name-uniqueness when no
        # url_search_string is given.
        Source.objects.create(**self.valid_data, url_search_string='testhomepage.com/section-a/*')
        serializer = SourceSerializer(data={
            **self.valid_data,
            'url_search_string': 'testhomepage.com/section-b/*',
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_update_existing_source_without_changing_name_is_valid(self):
        # validate_name's duplicate check must exclude the instance being
        # updated, otherwise every update of a Source (without changing its
        # name) would incorrectly flag itself as a duplicate of itself.
        source = Source.objects.create(**self.valid_data)
        updated_data = {**self.valid_data, 'notes': 'updated notes'}
        serializer = SourceSerializer(source, data=updated_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
