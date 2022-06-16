from rest_framework import routers
from .api import UserViewSet

router = routers.DefaultRouter()
router.register('api/users', UserViewSet, 'user')
urlpatterns = router.urls
