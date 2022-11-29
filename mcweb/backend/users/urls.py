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
    path('activate-user/<uidb64>/<token>', views.activate_user, name='activate'),
    path('activate-success', RedirectView.as_view(url='https://search.mediacloud.org/') )
]
