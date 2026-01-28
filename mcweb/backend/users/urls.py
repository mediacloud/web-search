from django.urls import path
from rest_framework import routers
from .api import RequestReset, ResetPassword, ConfirmedEmail
from . import views

router = routers.DefaultRouter() 
router.register('request-reset', RequestReset, 'request-reset')
router.register('reset-password', ResetPassword, 'reset-password')
router.register('confirmed-email', ConfirmedEmail, 'confirmed-email')

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
    path('email-confirmed', ConfirmedEmail.as_view()),
]
