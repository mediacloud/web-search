<<<<<<< HEAD
from rest_framework import routers
from .api import LeadViewSet, UserViewSet
=======
# we aren't going to specifically create paths 
from rest_framework import routers
from .api import LeadViewSet
>>>>>>> 9309a066aeb15de4337e581541dce9c4854c8517

router = routers.DefaultRouter()
router.register('api/leads', LeadViewSet, 'leads')
router.register('api/users', UserViewSet, 'user')
urlpatterns = router.urls
