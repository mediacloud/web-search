from .models import Collection, Feed, Source
from rest_framework import viewsets, permissions
from .serializer import CollectionSerializer, FeedsSerializer, SourcesSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    permission_classes = [
        permissions.IsAuthenticated
    ]
    serializer_class = CollectionSerializer


class FeedsViewSet(viewsets.ModelViewSet):
    queryset = Feed.objects.all()
    permission_classes = [
        permissions.IsAuthenticated
    ]
    serializer_class = FeedsSerializer


class SourcesViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.all()
    permission_classes = [
        permissions.IsAuthenticated
    ]
    serializer_class = SourcesSerializer
