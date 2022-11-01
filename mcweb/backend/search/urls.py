from django.urls import path
from rest_framework import routers 
from . import views
from .api import SearchViewSet

# responsible for mapping the routes and paths in your project
router = routers.DefaultRouter() 
router.register('collections', SearchViewSet, 'collections')


urlpatterns = [
    path('total-count', views.total_count),
    path('sample', views.sample),
    path('count-over-time', views.count_over_time),
    path('download-counts-over-time', views.download_counts_over_time_csv),
    path('download-sample-stories', views.download_sample_stories_csv)
]

urlpatterns += router.urls
