from django.urls import URLPattern
from rest_framework import routers 
from .api import FeedsViewSet, SourcesViewSet, CollectionViewSet

router = routers.DefaultRouter() 
router.resgister('api/sources/feeds', FeedsViewSet, 'feeds')
router.resgister('api/sources/sources', SourcesViewSet, 'sources')
router.resgister('api/sources/collections', CollectionViewSet, 'collections')

urlpatterns = router.urls