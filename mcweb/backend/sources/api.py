from django.shortcuts import get_object_or_404
from .models import Collection, Feed, Source
from rest_framework import viewsets, permissions
from .serializer import CollectionSerializer, FeedsSerializer, SourcesSerializer, SourcesCollectionSerializer, CollectionsSourceSerializer, FeaturedCollectionsSerializer, SourceListSerializer
from rest_framework.response import Response
from collections import namedtuple
import json
import os 
from settings import BASE_DIR

class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = CollectionSerializer
    def list(self, request):
        queryset = Collection.objects.all() 
        file_path = os.path.join(BASE_DIR, 'backend/sources/media-collection.json')
        json_data = open(file_path) 
        deserial_data = json.load(json_data) 
        collection_return = [] 
        for collection in deserial_data['featuredCollections']['entries']: 
           for id in collection['tags']: 
            featured_collection = get_object_or_404(queryset, pk=id) 
            collection_return.append(featured_collection) 
        serializer = FeaturedCollectionsSerializer({'collections':collection_return})
        return Response(serializer.data) 


class FeedsViewSet(viewsets.ModelViewSet):
    queryset = Feed.objects.all()
    permission_classes = [
        permissions.AllowAny

    ]
    serializer_class = FeedsSerializer


class SourcesViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = SourcesSerializer 

class SourcesCollectionsViewSet(viewsets.ViewSet):
    def retrieve(self, request, pk=None): 
        Sources_collections_tuple = namedtuple('Sources_collections_tuple', ('sources', 'collections')) 
        collection_bool = request.query_params.get('collection') 
        if (collection_bool == 'true'):
            collections_queryset = Collection.objects.all()
            collection = get_object_or_404(collections_queryset, pk=pk) 
            source_associations = collection.source_set.all() 
            serializer = SourceListSerializer({'sources' : source_associations})
            return Response(serializer.data)
        else :
            sources_queryset = Source.objects.all()
            source = get_object_or_404(sources_queryset, pk=pk)
            collection_associations = source.collections.all()
            ret_obj = Sources_collections_tuple(
                collections=collection_associations,
                sources=source
            )
            serializer = CollectionsSourceSerializer(ret_obj)
            return Response(serializer.data)


    def destroy(self, request, pk=None):
        collection_bool = request.query_params.get('collection')
        if (collection_bool == 'true'): #check in the query_params if collection=true, if 'true' the pk is a collection pk, else pk is for a source
            collections_queryset = Collection.objects.all() # make collection queryset
            collection = get_object_or_404(collections_queryset, pk=pk) # get collection based on wildcard :id(pk)
            source_id = request.query_params.get('source_id') #get source_id from params
            sources_queryset = Source.objects.all() # make source queryset
            source = get_object_or_404(sources_queryset, pk=source_id) #find source
            collection.source_set.remove(source) #remove association from collection
            return Response({'collection_id': pk, 'source_id': source_id})
        else :
            sources_queryset = Source.objects.all()
            source = get_object_or_404(sources_queryset, pk=pk)
            collection_id = request.query_params.get('collection_id')
            collections_queryset= Collection.objects.all()
            collection = get_object_or_404(collections_queryset, pk=collection_id)
            source.collections.remove(collection)
            return Response({'collection_id': collection_id, 'source_id': pk})

    def create(self,request):
        print(request)
        print(request.data)
        source_id = request.data['source_id']
        sources_queryset = Source.objects.all()
        source = get_object_or_404(sources_queryset, pk=source_id)
        collection_id = request.data['collection_id']
        collections_queryset = Collection.objects.all()
        collection = get_object_or_404(collections_queryset, pk=collection_id)
        source.collections.add(collection)
        return Response({'source_id': source_id, 'collection_id': collection_id})



        

