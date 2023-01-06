from django.urls import path
from django.views.generic.base import RedirectView
from . import views

# responsible for mapping the routes and paths in your project
urlpatterns = [
    path('login', views.login),
    path('logout', views.logout),
    path('register', views.register),
    path('profile', views.profile),
    path('delete-user', views.delete_user),
    path("")
    # path('reset-password', views.reset_password)
]
