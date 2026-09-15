from django.test import TestCase

from backend.sources.models import Source
from util.exceptions import UserValueError

from ..utils import _validate_sources_or_collections


class ValidateSourcesOrCollectionsTest(TestCase):
    """
    _validate_sources_or_collections backs the media-cloud query-scoping
    validation in utils._for_media_cloud -- untested directly before.
    """

    def setUp(self):
        self.source = Source.objects.create(
            name="testsource.com", homepage="http://testsource.com",
            platform=Source.SourcePlatforms.ONLINE_NEWS)

    def test_all_valid_ids_does_not_raise(self):
        _validate_sources_or_collections(
            [str(self.source.id)], Source, Source.SourcePlatforms.ONLINE_NEWS)

    def test_unknown_id_raises_user_value_error_naming_it(self):
        bogus_id = self.source.id + 1000
        with self.assertRaises(UserValueError) as ctx:
            _validate_sources_or_collections(
                [str(self.source.id), str(bogus_id)], Source, Source.SourcePlatforms.ONLINE_NEWS)
        self.assertIn(str(bogus_id), str(ctx.exception))

    def test_id_for_wrong_platform_is_treated_as_invalid(self):
        other_platform_source = Source.objects.create(
            name="other.com", homepage="http://other.com",
            platform=Source.SourcePlatforms.YOUTUBE)
        with self.assertRaises(UserValueError) as ctx:
            _validate_sources_or_collections(
                [str(other_platform_source.id)], Source, Source.SourcePlatforms.ONLINE_NEWS)
        self.assertIn(str(other_platform_source.id), str(ctx.exception))
