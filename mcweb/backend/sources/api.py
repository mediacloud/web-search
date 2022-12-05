import time
import json
import os
import requests
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Case, When
from rest_framework import viewsets, permissions
import mcmetadata.urls as urls
from rest_framework.renderers import JSONRenderer
from typing import List

from .serializer import CollectionSerializer, FeedsSerializer, SourcesSerializer, CollectionListSerializer, SourceListSerializer
from backend.util import csv_stream
from util.cache import cache_by_kwargs
from .models import Collection, Feed, Source


def _featured_collection_ids() -> List:
    this_dir = os.path.dirname(os.path.realpath(__file__))
    file_path = os.path.join(this_dir, 'data', 'featured-collections.json')
    with open(file_path) as json_file:
        data = json.load(json_file)
        list_ids = []
        for collection in data['featuredCollections']['entries']:
            for cid in collection['tags']:
                list_ids.append(cid)
        return list_ids


class CollectionViewSet(viewsets.ModelViewSet):
    # use this queryset, so we ensure that every result has `source_count` included
    queryset = Collection.objects.\
        annotate(source_count=Count('source')).\
        order_by('-source_count').\
        all()

    MAX_SEARCH_RESULTS = 50

    permission_classes = [
        permissions.IsAuthenticated
    ]
    serializer_class = CollectionSerializer

    @cache_by_kwargs()
    def _cached_serialized_featured_collections(self) -> str:
        featured_collection_ids = _featured_collection_ids()
        ordered_cases = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(featured_collection_ids)])
        featured_collections = self.queryset.filter(pk__in=featured_collection_ids,
                                                    id__in=featured_collection_ids).order_by(ordered_cases)

        serializer = self.serializer_class(featured_collections, many=True)
        return serializer.data

    @action(detail=False)
    def featured(self, request):
        data = self._cached_serialized_featured_collections()
        response = Response({"collections":data})
        response.accepted_renderer = JSONRenderer()
        response.accepted_media_type = "application/json"
        response.renderer_context = {}
        response.render()
        return response

    @action(detail=False)
    def search(self, request):
        query = request.query_params["query"]
        collections = self.queryset.filter(name__icontains=query)[:self.MAX_SEARCH_RESULTS]
        serializer = self.serializer_class(collections, many=True)
        return Response({"collections":serializer.data})


class FeedsViewSet(viewsets.ModelViewSet):
    queryset = Feed.objects.all()
    permission_classes = [
        permissions.IsAuthenticated

    ]
    serializer_class = FeedsSerializer

    @action(methods=['post'], detail=False)
    def sources_feeds(self, request):
        source_id = request.data["source_id"]
        response = requests.get(f'https://rss-fetcher.tarbell.mediacloud.org/api/sources/{source_id}/feeds')
        feeds = response.json()
        feeds = feeds["results"]
        return Response({"feeds": feeds})


class SourcesViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.all()
    permission_classes = [
        permissions.IsAuthenticated
    ]
    serializer_class = SourcesSerializer

    @action(methods=['post'], detail=False)
    def upload_sources(self, request):
        collection = Collection.objects.get(pk=request.data['collection_id'])
        email_title = "Updating collection {}".format(collection.name)
        email_text = ""
        queryset = Source.objects.all()
        for row in request.data['sources']:
            if len(row.keys()) <= 1:
                continue
            if len(row['id']) > 0 and row['id'] != 'null':
                existing_source = queryset.filter(pk=row['id'])
                canonical_domain = existing_source[0].name
            else:
                canonical_domain = urls.canonical_domain(row['homepage'])
                existing_source = queryset.filter(name=canonical_domain)
            if len(existing_source) == 0:
                existing_source = Source.create_new_source(row)
                email_text += "\n {}: created new source".format(
                    canonical_domain)
            elif len(existing_source) > 1:
                existing_source = existing_source[0]
                email_text += "\n {}: updated existing source".format(
                    canonical_domain)
            else:
                existing_source = existing_source[0]
                email_text += "\n {}: updated existing source".format(
                    canonical_domain)
            collection.source_set.add(existing_source)
        send_source_upload_email(email_title, email_text, request.user.email)
        print(email_text)
        return Response({'title': email_title, 'text': email_text})

    @action(methods=['GET'], detail=False)
    def download_csv(self, request):
        collection_id = request.query_params.get('collection_id')
        collection = Collection.objects.get(id=collection_id)
        source_associations = collection.source_set.all()
        # we want to stream the results back to the user row by row (based on paging through results)
        def data_generator():
            first_page = True
            for source in source_associations:
                if first_page:  # send back columun names, which differ by platform
                    yield (['id', 'name', 'url_search_string', 'label', 'homepage', 'notes',
                'stories_per_week', 'first_story', 'publication_country', 'publication_state',
                'primary_langauge', 'media_type'])
                yield ([source.id, source.name, source.url_search_string, source.label,
                             source.homepage, source.notes, source.stories_per_week,
                             source.first_story, source.pub_country, source.pub_state, source.primary_language,
                             source.media_type])
                first_page = False

        filename = "Collection-{}-{}-sources-{}.csv".format(collection_id, collection.name, _filename_timestamp())
        streamer = csv_stream.CSVStream(filename, data_generator)
        return streamer.stream()


class SourcesCollectionsViewSet(viewsets.ViewSet):

    def retrieve(self, request, pk=None):
        collection_bool = request.query_params.get('collection')
        if (collection_bool == 'true'):
            collections_queryset = Collection.objects.all()
            collection = get_object_or_404(collections_queryset, pk=pk)
            source_associations = collection.source_set.all()
            serializer = SourceListSerializer({'sources': source_associations})
            return Response(serializer.data)
        else:
            sources_queryset = Source.objects.all()
            source = get_object_or_404(sources_queryset, pk=pk)
            collection_associations = source.collections.all()
            serializer = CollectionListSerializer(
                {'collections': collection_associations})
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
        else:
            sources_queryset = Source.objects.all()
            source = get_object_or_404(sources_queryset, pk=pk)
            collection_id = request.query_params.get('collection_id')
            collections_queryset = Collection.objects.all()
            collection = get_object_or_404(
                collections_queryset, pk=collection_id)
            source.collections.remove(collection)
            return Response({'collection_id': collection_id, 'source_id': pk})

    def create(self, request):
        source_id = request.data['source_id']
        sources_queryset = Source.objects.all()
        source = get_object_or_404(sources_queryset, pk=source_id)
        collection_id = request.data['collection_id']
        collections_queryset = Collection.objects.all()
        collection = get_object_or_404(collections_queryset, pk=collection_id)
        source.collections.add(collection)
        return Response({'source_id': source_id, 'collection_id': collection_id})


def _filename_timestamp() -> str:
    return time.strftime("%Y%m%d%H%M%S", time.localtime())
