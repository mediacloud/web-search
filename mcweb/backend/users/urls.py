from django.urls import path
from django.views.generic.base import RedirectView
from . import views

# responsible for mapping the routes and paths in your project
urlpatterns = [
    path('login', views.login),
    path('logout', views.logout),
    path('register', views.register),
    path('profile', views.profile),
    path('send-email', views.reset_password_request),
    path('email-exists', views.email_exists),
    path('reset-password', views.reset_password),
    path('password-strength', views.password_strength),
    path('delete-user', views.delete_user),
    path('reset-token', views.reset_token),
    path('email-from-token', views.email_from_token),
]
