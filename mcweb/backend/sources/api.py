from http.client import CannotSendHeader
from importlib.metadata import metadata
from django.shortcuts import get_object_or_404
from .models import Collection, Feed, Source
from rest_framework import viewsets, permissions
from .serializer import CollectionSerializer, FeedsSerializer, SourcesSerializer, CollectionListSerializer, SourceListSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from collections import namedtuple
import json
import os 
from settings import BASE_DIR
from mcmetadata import urls

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
        serializer = CollectionListSerializer({'collections':collection_return})
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

    @action(methods=['post'], detail=False)
    def upload_sources(self, request):
        collection = Collection.objects.get(pk=request.data['collection_id'])
        email_title = "Updating collection {}".format(collection.name)
        email_text = ""
        queryset = Source.objects.all()
        for row in request.data['sources']:
            # print(row)
            if len(row['id']) !=0 and row['id'] != 'null':
                existing_source = queryset.filter(pk=row['id'])
                canonical_domain = existing_source[0].name
                # print(existing_source)
            else:
                canonical_domain = urls.canonical_domain(row['homepage'])
                existing_source = queryset.filter(name=canonical_domain)
                # print(existing_source)
            if len(existing_source) == 0:
                # print("Creating Source....", canonical_domain)
                existing_source = Source.create_new_source(row) 
                # print(existing_source)
                email_text += "\n {}: created new source".format(canonical_domain)
            elif len(existing_source) >1:
                existing_source = existing_source[0]
                # print(existing_source)
                email_text += "\n {}: updated existing source".format(canonical_domain)
            else:
                # print(canonical_domain)
                email_text += "\n {}: updated existing source".format(canonical_domain)
            # print("adding source", existing_source, "to", collection.name)
        # print(email_title)
        # print(email_text)
        
        #   collection.source_set.add(existing_source)
        #   send_email_summary(current_user.email, email_title, email_text)
        return Response("Sources Upload Complete")

class SourcesCollectionsViewSet(viewsets.ViewSet):
    def retrieve(self, request, pk=None): 
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
            serializer = CollectionListSerializer({'collections' : collection_associations})
            return Response(serializer.data)


    def destroy(self, request, pk=None):
        collection_bool = request.query_params.get('collection')
        if (collection_bool == 'true'): 
            collections_queryset = Collection.objects.all()
            collection = get_object_or_404(collections_queryset, pk=pk) 
            source_id = request.query_params.get('source_id')
            sources_queryset = Source.objects.all() 
            source = get_object_or_404(sources_queryset, pk=source_id) 
            collection.source_set.remove(source) 
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
        source_id = request.data['source_id']
        sources_queryset = Source.objects.all()
        source = get_object_or_404(sources_queryset, pk=source_id)
        collection_id = request.data['collection_id']
        collections_queryset = Collection.objects.all()
        collection = get_object_or_404(collections_queryset, pk=collection_id)
        source.collections.add(collection)
        return Response({'source_id': source_id, 'collection_id': collection_id})





