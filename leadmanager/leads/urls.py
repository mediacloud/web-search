# we aren't going to specifically create paths 

from rest_framework import routers 
from .api import LeadViewSet

router = routers.DefaultRouter() 
router.register('api/leads', LeadViewSet, 'leads')

urlpatterns = router.urls

