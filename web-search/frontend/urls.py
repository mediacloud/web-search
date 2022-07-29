from django.urls import path

from . import views


# tells django to search for URL patterns
# responsible for mapping the routes and paths in your project
urlpatterns = [
    path('', views.index, name="home"),
]
