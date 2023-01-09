import time
import json
import os
import requests
import requests.auth
import datetime as dt
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Case, When, Q
from rest_framework import viewsets, permissions
import mcmetadata.urls as urls
from rest_framework.renderers import JSONRenderer
from typing import List, Optional

from .serializer import CollectionSerializer, FeedsSerializer, SourcesSerializer, SourcesViewSerializer, CollectionWriteSerializer
from backend.util import csv_stream
from util.cache import cache_by_kwargs
from .models import Collection, Feed, Source
from .permissions import IsGetOrIsStaff
from .rss_fetcher_api import RssFetcherApi
from util.send_emails import send_source_upload_email


def _featured_collection_ids(platform: Optional[str]) -> List:
    this_dir = os.path.dirname(os.path.realpath(__file__))
    file_path = os.path.join(this_dir, 'data', 'featured-collections.json')
    with open(file_path) as json_file:
        data = json.load(json_file)
        list_ids = []
        for collection in data['featuredCollections']['entries']:
            if (platform is None) or (collection['platform'] == platform):
                for cid in collection['collections']:
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
        IsGetOrIsStaff,
    ]
    serializer_class = CollectionSerializer

    # overriden to support filtering all endpoints by collection id
    def get_queryset(self):
        queryset = super().get_queryset()
        # non-staff can only see public collections
        if not self.request.user.is_staff:
            queryset = queryset.filter(public=True)
        # add in optional filters
        source_id = self.request.query_params.get("source_id")
        if source_id is not None:
            source_id = int(source_id)  # validation: should throw a ValueError back up the chain
            queryset = queryset.filter(source__id=source_id)
        platform = self.request.query_params.get("platform")
        if platform is not None:
            # TODO: validate this is a valid platform type
            queryset = queryset.filter(platform=platform)
        name = self.request.query_params.get("name")
        if name is not None:
            queryset = queryset.filter(name__icontains=name)
        return queryset

    def get_serializer_class(self):
        serializer_class = self.serializer_class
        if self.request.method != 'GET':
            serializer_class = CollectionWriteSerializer
        return serializer_class

    @cache_by_kwargs()
    def _cached_serialized_featured_collections(self, platform) -> str:
        featured_collection_ids = _featured_collection_ids(platform)
        ordered_cases = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(featured_collection_ids)])
        featured_collections = self.queryset.filter(pk__in=featured_collection_ids,
                                                    id__in=featured_collection_ids).order_by(ordered_cases)

        serializer = self.serializer_class(featured_collections, many=True)
        return serializer.data

    @action(detail=False)
    def featured(self, request):
        data = self._cached_serialized_featured_collections(request.data.get('platform', None))
        response = Response({"collections":data})
        response.accepted_renderer = JSONRenderer()
        response.accepted_media_type = "application/json"
        response.renderer_context = {}
        response.render()
        return response
    
    @action(methods=['GET'], detail=False)
    def geo_collections(self, request):
        this_dir = os.path.dirname(os.path.realpath(__file__))
        file_path = os.path.join(this_dir, 'data', 'country-collections.json')
        json_data = open(file_path)  
        deserial_data = json.load(json_data) 
        return Response({"countries": deserial_data})


class FeedsViewSet(viewsets.ModelViewSet):
    queryset = Feed.objects.all()
    permission_classes = [
        IsGetOrIsStaff
    ]
    serializer_class = FeedsSerializer

    # overriden to support filtering all endpoints
    def get_queryset(self):
        queryset = super().get_queryset()
        source_id = self.request.query_params.get("source_id")
        if source_id is not None:
            source_id = int(source_id)  # validation: should throw a ValueError back up the chain
            queryset = queryset.filter(source_id=source_id)
        # the rss-fetcher wants to know which feeds were changed since last time it checked
        modified_since = self.request.query_params.get("modified_since")  # in epoch times
        if modified_since is not None:
            modified_since = float(modified_since)  # validation: should throw a ValueError back up the chain
            modified_since = dt.datetime.fromtimestamp(modified_since)
            queryset = queryset.filter(modified_at__gte=modified_since)
        # passed a "now" value returned by /api/version
        modified_before = self.request.query_params.get("modified_before")  # in epoch times
        if modified_before is not None:
            modified_before = float(modified_before)  # validation: should throw a ValueError back up the chain
            modified_before = dt.datetime.fromtimestamp(modified_before)
            queryset = queryset.filter(modified_at__lt=modified_before)

        if modified_since is not None or modified_before is not None:
            if modified_before is not None:
                # closed ended.
                # order by id so that pages are invariant
                queryset = queryset.order_by('id')
            else:
                # open ended (not used by rss-fetcher)
                # make sure newest entries at end, and pages are invariant
                queryset = queryset.order_by('modified_at', 'id')
            
        return queryset

    @action(detail=False)
    def details(self, request):
        source_id = int(self.request.query_params.get("source_id"))
        with RssFetcherApi() as rss:
            return Response({"feeds": rss.source_feeds(source_id)})
    
    @action(detail=False, url_path='feed-details')
    def feed_details(self, request):
        feed_id = int(self.request.query_params.get("feed_id"))
        with RssFetcherApi() as rss:
            return Response({"feed": rss.feed(feed_id)})

    @action(detail=False)
    def stories(self, request):
        feed_id = self.request.query_params.get("feed_id", None)
        source_id = self.request.query_params.get("source_id", None)
        
        with RssFetcherApi() as rss:
            if feed_id is not None:
                stories = rss.feed_stories(int(feed_id))

            if source_id is not None:
                stories = rss.source_stories(int(source_id))

        return Response({"stories": stories })

    @action(detail=False)
    def history(self, request):
        feed_id = int(self.request.query_params.get("feed_id"))
        with RssFetcherApi() as rss:
            feed_history = rss.feed_history(feed_id)
            feed_history = sorted(feed_history, key=lambda d: d['created_at'], reverse=True)
            return Response({"feed": feed_history})

    @action(detail=False)
    def fetch(self, request):
        feed_id = self.request.query_params.get("feed_id", None)
        source_id = self.request.query_params.get("source_id", None)
        total = 0
        with RssFetcherApi() as rss:
            if feed_id is not None:
                total += rss.feed_fetch_soon(int(feed_id))
        
            if source_id is not None:
                total += rss.source_fetch_soon(int(source_id))

        return Response({"fetch_response": total})


class SourcesViewSet(viewsets.ModelViewSet):
    queryset = Source.objects.\
        annotate(collection_count=Count('collections')).\
        order_by('-collection_count').\
        all()
    permission_classes = [
        IsGetOrIsStaff
    ]
    serializers_by_action = {
        'default': SourcesSerializer,
        'list': SourcesViewSerializer,
        'retrieve': SourcesViewSerializer,
    }

    def get_serializer_class(self):
        if self.action in self.serializers_by_action.keys():
            return self.serializers_by_action[self.action]
        return self.serializers_by_action['default']

    # overriden to support filtering all endpoints by collection id
    def get_queryset(self):
        queryset = super().get_queryset()
        collection_id = self.request.query_params.get("collection_id")
        if collection_id is not None:
            collection_id = int(collection_id)  # validation: should throw a ValueError back up the chain
            queryset = queryset.filter(collections__id=collection_id)
        platform = self.request.query_params.get("platform")
        if platform is not None:
            # TODO: check if the platform is a valid option
            queryset = queryset.filter(platform=platform)
        name = self.request.query_params.get("name")
        if name is not None:
            queryset = queryset.filter(Q(name__icontains=name) | Q(label__icontains=name))
        return queryset

    @action(methods=['post'], detail=False)
    def upload_sources(self, request):
        collection = Collection.objects.get(pk=request.data['collection_id'])
        email_title = "Updating collection {}".format(collection.name)
        email_text = ""
        queryset = Source.objects
        counts = dict(updated=0, skipped=0, created=0)
        for row in request.data['sources']:
            # skip empty rows
            if len(row.keys()) <= 1:
                continue
            # check if this is an update
            if row.get('id', None) and (row['id'] > 0) and (row['id'] != 'null'):
                existing_source = queryset.filter(pk=row['id'])
            else:
                # if online news, need to make check if canonical domain exists
                if row['platform'] == Source.SourcePlatforms.ONLINE_NEWS:
                    canonical_domain = urls.canonical_domain(row['homepage'])
                    # call filter here, not get, so we can check for multiple matches (url_query_string case)
                    existing_source = queryset.filter(name=canonical_domain, platform=Source.SourcePlatforms.ONLINE_NEWS)
                else:
                    # a diff platform, so just check for unique name (ie. twitter handle, subreddit name, YT channel)
                    existing_source = queryset.filter(name=row['name'], platform=row['platform'])
            # Making a new one
            if len(existing_source) == 0:
                existing_source = Source.create_from_dict(row)
                email_text += "\n {}: created new {} source".format(existing_source.name, existing_source.platform)
                counts['created'] += 1
            # Updating unique match
            elif len(existing_source) == 1:
                existing_source = existing_source[0]
                existing_source.update_from_dict(row)
                email_text += "\n {}: updated existing {} source".format(existing_source.name, existing_source.platform)
                counts['updated'] += 1
            # Request to update non-unique match, so skip and force them to do it by hand
            else:
                email_text += "\n ⚠️ {}: multiple matches - cowardly skipping so you can do it by hand existing source".\
                    format(existing_source[0]['name'])
                counts['skipped'] += 1
                continue
            collection.source_set.add(existing_source)
        send_source_upload_email(email_title, email_text, request.user.email)
        return Response(counts)

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
    
    permission_classes = [
        IsGetOrIsStaff
    ]

    def retrieve(self, request, pk=None):
        collection_bool = request.query_params.get('collection')
        if (collection_bool == 'true'):
            collections_queryset = Collection.objects.all()
            collection = get_object_or_404(collections_queryset, pk=pk)
            source_associations = collection.source_set.all()
            serializer = SourcesSerializer(source_associations, many=True)
            return Response({'sources': serializer.data})
        else:
            sources_queryset = Source.objects.all()
            source = get_object_or_404(sources_queryset, pk=pk)
            collection_associations = source.collections.all()
            serializer = CollectionWriteSerializer(collection_associations, many=True)
            return Response({'collections':serializer.data})

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
