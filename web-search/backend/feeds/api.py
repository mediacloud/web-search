from feeds.models import Feeds
from rest_framework import viewsets, permissions
from .serializers import FeedsSerializer


class FeedsViewSet(viewsets.ModelViewSet):
    queryset = Feeds.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = FeedsSerializer
