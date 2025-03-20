from django.urls import path
from rest_framework import routers
from django.views.generic.base import RedirectView
from .api import RequestReset, ResetPassword
from . import views

router = routers.DefaultRouter() 
router.register('request-reset', RequestReset, 'request-reset')
router.register('reset-password', ResetPassword, 'reset-password')

urlpatterns = [
    path('login', views.login),
    path('logout', views.logout),
    path('register', views.register),
    path('profile', views.profile),
    path('send-email', views.reset_password_request),
    path('email-exists', views.email_exists),
    path('reset-password', ResetPassword.as_view()),
    path('request-reset', RequestReset.as_view()),
    path('password-strength', views.password_strength),
    path('delete-user', views.delete_user),
    path('reset-token', views.reset_token),
    path('email-from-token', views.email_from_token),
    path('users-quotas', views.users_quotas),
]
