from django.shortcuts import get_object_or_404
from .models import Collection, Feed, Source
from rest_framework import viewsets, permissions
from .serializer import CollectionSerializer, FeedsSerializer, SourcesSerializer, SourcesCollectionSerializer, CollectionsSourceSerializer, FeaturedCollectionsSerializer
from rest_framework.response import Response
from collections import namedtuple
import json

class CollectionViewSet(viewsets.ModelViewSet):
    queryset = Collection.objects.all()
    permission_classes = [
        permissions.AllowAny
    ]
    serializer_class = CollectionSerializer
    def list(self, request):
        queryset = Collection.objects.all() 
        json_data = open('mcweb/backend/sources/media-collection.json') # open json file
        deserial_data = json.load(json_data) # deserialize the data
        collection_return = [] # create return array
        for collection in deserial_data['featuredCollections']['entries']: #first iterate through the featuredCollections entries
           for id in collection['tags']: #next iterate through all the tags(ids) for any given featuredCollection 
            featured_collection = get_object_or_404(queryset, pk=id) # get the object or 404
            collection_return.append(featured_collection) #add object to return array
        serializer = FeaturedCollectionsSerializer({'collections':collection_return}) #add it through new serializer
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
        Sources_collections_tuple = namedtuple('Sources_collections_tuple', ('sources', 'collections')) #create tuple to pass through the serializer
        collection_bool = request.query_params.get('collection') #check in the query_params if collection=true, if 'true' the pk is a collection pk, else pk is for a source
        if (collection_bool == 'true'):
            collections_queryset = Collection.objects.all()
            collection = get_object_or_404(collections_queryset, pk=pk) #see if there is a collection given wildcard and queryset
            source_associations = collection.source_set.all() #get the associations for the collection
            ret_obj = Sources_collections_tuple(
                sources=source_associations,
                collections=collection
            ) # create tuple to be able to pass to serializer
            serializer = SourcesCollectionSerializer(ret_obj)
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



        

