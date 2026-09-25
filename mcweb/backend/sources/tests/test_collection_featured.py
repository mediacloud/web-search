from rest_framework.test import APITestCase

from ..api import featured_collections
from ..models import Collection

URL = "/api/sources/collections/featured/"


class FeaturedCollectionsHelperTest(APITestCase):
    """
    featured_collections() (backend/sources/api.py) is the one place that
    interprets featured_rank -- untested before. Tested directly (not
    through the cached wrapper) since it's a plain queryset builder.
    """

    def test_only_returns_featured_collections(self):
        featured = Collection.objects.create(name="Featured", featured=True)
        Collection.objects.create(name="Not Featured", featured=False)

        results = list(featured_collections(None))

        self.assertEqual([c.id for c in results], [featured.id])

    def test_orders_by_featured_rank_with_nulls_last(self):
        unranked = Collection.objects.create(name="Unranked", featured=True, featured_rank=None)
        second = Collection.objects.create(name="Second", featured=True, featured_rank=2)
        first = Collection.objects.create(name="First", featured=True, featured_rank=1)

        results = list(featured_collections(None))

        self.assertEqual([c.id for c in results], [first.id, second.id, unranked.id])

    def test_platform_filter_translates_onlinenews_alias(self):
        online_news = Collection.objects.create(
            name="Online News", featured=True, platform=Collection.CollectionPlatforms.ONLINE_NEWS)
        Collection.objects.create(
            name="Reddit", featured=True, platform=Collection.CollectionPlatforms.REDDIT)

        results = list(featured_collections("onlinenews"))

        self.assertEqual([c.id for c in results], [online_news.id])
