from django.urls import path

from . import views

# responsible for mapping the routes and paths in your project
urlpatterns = [
    path('login', views.login),
    path('logout', views.logout),
    path('register', views.register),
    path('profile', views.profile),
    path('send-email', views.sendEmail),
    path('email-exists', views.emailExists)
]
