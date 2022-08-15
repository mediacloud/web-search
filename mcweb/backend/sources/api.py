from django.shortcuts import get_object_or_404
from .models import Collection, Feed, Source
from rest_framework import viewsets, permissions
from .serializer import CollectionSerializer, FeedsSerializer, SourcesSerializer, SourcesCollectionsSerializer, CollectionsSourcesSerializer
from rest_framework.response import Response
from collections import namedtuple

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

class SourcesCollectionsViewSet(viewsets.ViewSet):
    def retrieve(self, request, pk=None): 
        Sources_collections_tuple = namedtuple('Sources_collections_tuple', ('sources', 'collections'))
        collectionBool = request.query_params.get('collection')
        if (collectionBool == 'true'):
            queryset = Collection.objects.all()
            collection = get_object_or_404(queryset, pk=pk)
            associations = collection.source_set.all()
            ret_obj = Sources_collections_tuple(
                sources=associations,
                collections=collection
            )
            serializer = SourcesCollectionsSerializer(ret_obj)
            return Response(serializer.data)
        else :
            queryset = Source.objects.all()
            source = get_object_or_404(queryset, pk=pk)
            associations = source.collections.all()
            ret_obj = Sources_collections_tuple(
                collections=associations,
                sources=source
            )
            serializer = CollectionsSourcesSerializer(ret_obj)
            return Response(serializer.data)

        

