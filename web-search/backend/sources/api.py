from sources.models import Sources
from rest_framework import viewsets, permissions
from .serializers import SourcesSerializer

class SourcesViewSet(viewsets.ModelViewSet):
    queryset = Sources.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = SourcesSerializer
