from rest_framework import routers
from .api import LeadViewSet, UserViewSet

router = routers.DefaultRouter()
router.register('api/leads', LeadViewSet, 'leads')
router.register('api/users', UserViewSet, 'user')
urlpatterns = router.urls
