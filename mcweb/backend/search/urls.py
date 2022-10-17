from django.urls import path
from rest_framework import routers 
from . import views
from .api import SearchViewSet

# responsible for mapping the routes and paths in your project
router = routers.DefaultRouter() 
router.register('collections', SearchViewSet, 'collections')


urlpatterns = [
    path('search', views.search),
    path('query', views.query )
]

urlpatterns += router.urls
