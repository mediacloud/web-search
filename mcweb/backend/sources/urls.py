from rest_framework import routers
from .api import FeedsViewSet, SourcesViewSet, CollectionViewSet, SourcesCollectionsViewSet, AlternativeDomainViewSet

router = routers.DefaultRouter() 
router.register('feeds', FeedsViewSet, 'feeds')
router.register('sources', SourcesViewSet, 'sources')
router.register('collections', CollectionViewSet, 'collections')
router.register('sources-collections', SourcesCollectionsViewSet, 'sources-collections' )
router.register('alternative-domains', AlternativeDomainViewSet, 'alternative-domains')

urlpatterns = router.urls
