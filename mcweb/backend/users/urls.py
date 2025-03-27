from django.urls import path
from rest_framework import routers
from django.views.generic.base import RedirectView
from .api import RequestReset, ResetPassword, GiveAPIAccess
from . import views

router = routers.DefaultRouter() 
router.register('request-reset', RequestReset, 'request-reset')
router.register('reset-password', ResetPassword, 'reset-password')
router.register('give-api-access', GiveAPIAccess, 'give-api-access')

urlpatterns = [
    path('login', views.login),
    path('logout', views.logout),
    path('register', views.register),
    path('profile', views.profile),
    path('reset-password', ResetPassword.as_view()),
    path('request-reset', RequestReset.as_view()),
    path('password-strength', views.password_strength),
    path('delete-user', views.delete_user),
    path('reset-token', views.reset_token),
    path('email-from-token', views.email_from_token),
    path('users-quotas', views.users_quotas),
    path('give-api-access', GiveAPIAccess.as_view()),
]
