from django.urls import path

from . import views

# responsible for mapping the routes and paths in your project
urlpatterns = [
    path('search', views.search)
]
