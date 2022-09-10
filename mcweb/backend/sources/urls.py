from django.urls import URLPattern
from rest_framework import routers 
from .api import FeedsViewSet, SourcesViewSet, CollectionViewSet, SourcesCollectionsViewSet

from django.urls import path

from . import views

router = routers.DefaultRouter() 
router.register('feeds', FeedsViewSet, 'feeds')
router.register('sources', SourcesViewSet, 'sources')
router.register('collections', CollectionViewSet, 'collections')
router.register('sources-collections', SourcesCollectionsViewSet,'sources-collections')

urlpatterns = [
    path('csvDownload', views.csvDownload)
]

urlpatterns += router.urls
