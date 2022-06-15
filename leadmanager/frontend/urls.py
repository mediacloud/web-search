from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView)

from . import views

urlpatterns = [
    path('', views.index),
    path('accounts/', include("django.contrib.auth.urls")),  # new
    path('admin', admin.site.urls),
    path('csrf/', views.csrf),
    path('ping/', views.ping)
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
