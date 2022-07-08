from unicodedata import name
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView)

from . import views


# tells django to search for URL patterns
# responsible for mapping the routes and paths in your project
urlpatterns = [
    path('', views.index, name="home"),
    path('admin', admin.site.urls),
    path('accounts/', include("django.contrib.auth.urls")),
    path('accounts/logout', views.logout, name='logout'),
    path('accounts/login', views.login, name='login'),
    path('register', views.register, name="register"),

    # May need refactoring regarding the redundency (functions though)
    path('Sign-In', views.index),
    path('Sign-Up', views.index),
    path('Search', views.index),
    path('Collection', views.index),




    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
