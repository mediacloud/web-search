from django.urls import URLPattern
from rest_framework import routers 
from .api import FeedsViewSet, SourcesViewSet, CollectionViewSet

router = routers.DefaultRouter() 
router.register('feeds', FeedsViewSet, 'feeds')
router.register('sources', SourcesViewSet, 'sources')
router.register('collections', CollectionViewSet, 'collections')

urlpatterns = router.urls