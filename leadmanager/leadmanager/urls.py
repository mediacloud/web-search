from django.urls import path, include
from django.contrib import admin

urlpatterns = [
    path('', include('frontend.urls')),
    path('admin', admin.site.urls),
    path('api/auth/', include('users.urls'))
]
