from django.urls import URLPattern
from rest_framework import routers 
from .api import FeedsViewSet, SourcesViewSet, CollectionViewSet

router = routers.DefaultRouter() 
router.register('api/sources/feeds', FeedsViewSet, 'feeds')
router.register('api/sources/sources', SourcesViewSet, 'sources')
router.register('api/sources/collections', CollectionViewSet, 'collections')

urlpatterns = router.urls