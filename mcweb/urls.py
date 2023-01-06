from django.urls import path, include, re_path
from django.contrib import admin

from backend.version import version

urlpatterns = [
    path('', include('frontend.urls')), 
    path('admin', admin.site.urls),
    path('api/auth/', include('backend.users.urls')),
    path('api/search/', include('backend.search.urls')),
    path('api/sources/', include('backend.sources.urls')),
    path('api/version', version),
    path('api/', include('djoser.urls')),
    re_path(r'^(?:.*)/?', include('frontend.urls')),

]

