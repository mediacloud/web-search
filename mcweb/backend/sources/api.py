from .models import Collection
from rest_framework import viewsets, permissions
from .serializer import CollectionSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = CollectionSerializer
