from rest_framework import routers
from .api import FeedsViewSet, SourcesViewSet, CollectionViewSet, SourcesCollectionsViewSet

router = routers.DefaultRouter() 
router.register('feeds', FeedsViewSet, 'feeds')
router.register('sources', SourcesViewSet, 'sources')
router.register('collections', CollectionViewSet, 'collections')
router.register('sources-collections', SourcesCollectionsViewSet, 'sources-collections' )

urlpatterns = router.urls
