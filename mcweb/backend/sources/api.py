# Python
import datetime as dt
import json
import os
import time
from typing import List, Optional
from urllib.parse import urlparse, parse_qs

# PyPI
import mcmetadata.urls as urls
import requests
import requests.auth
from django.db.models import Case, Count, When, Q
from django.shortcuts import get_object_or_404
from mc_providers import PLATFORM_REDDIT, PLATFORM_TWITTER, PLATFORM_YOUTUBE
from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.exceptions import APIException
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

# mcweb
from settings import RSS_FETCHER_URL, RSS_FETCHER_USER, RSS_FETCHER_PASS # mcweb.settings

# mcweb/util
from util.cache import cache_by_kwargs
from util.send_emails import send_source_upload_email

# mcweb/backend/util
from backend.util import csv_stream
from backend.util.tasks import get_completed_tasks, get_pending_tasks

# local directory (mcweb/backend/sources)
from .serializer import CollectionSerializer, FeedSerializer, SourceSerializer, SourcesViewSerializer, CollectionWriteSerializer
from .models import Collection, Feed, Source
from .permissions import IsGetOrIsStaffOrContributor
from .rss_fetcher_api import RssFetcherApi
from .tasks import schedule_scrape_source, schedule_scrape_collection


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


def _all_platforms() -> List:
    return [PLATFORM_YOUTUBE, PLATFORM_REDDIT, PLATFORM_TWITTER, 'onlinenews']


class CollectionViewSet(viewsets.ModelViewSet):
    # use this queryset, so we ensure that every result has `source_count` included
    queryset = Collection.objects.\
        annotate(source_count=Count('source')).\
        order_by('-source_count').\
        all()

    MAX_SEARCH_RESULTS = 50

    permission_classes = [
        IsGetOrIsStaffOrContributor,
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
            # validation: should throw a ValueError back up the chain
            source_id = int(source_id)
            queryset = queryset.filter(source__id=source_id)
        platform = self.request.query_params.get("platform")
        # test validation? _all_platforms().count(platform) > 0
        if platform is not None and _all_platforms().count(platform) > 0:
            # TODO: validate this is a valid platform type
            if platform == "onlinenews":
                queryset = queryset.filter(platform="online_news")
            else:
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
        if platform == 'onlinenews':
            featured_collection_ids = _featured_collection_ids('online_news')
            ordered_cases = Case(*[When(pk=pk, then=pos)
                                 for pos, pk in enumerate(featured_collection_ids)])
            featured_collections = self.queryset.filter(pk__in=featured_collection_ids,
                                                        id__in=featured_collection_ids).order_by(ordered_cases)
        else:
            queryset = self.queryset.filter(platform=platform)
            featured_collections = queryset.filter(featured=True)

        serializer = self.serializer_class(featured_collections, many=True)
        return serializer.data

    @action(detail=False)
    def featured(self, request):
        data = self._cached_serialized_featured_collections(
            request.query_params.get('platform', None))
        response = Response({"collections": data})
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

    @action(methods=['GET'], detail=False, url_path='collections-from-list')
    def collections_from_list(self, request):
        collection_ids = request.query_params.get('c')
        if len(collection_ids) != 0:
            collection_ids = collection_ids.split(',')
            collection_ids = [int(i) for i in collection_ids]
        collections = Collection.objects.filter(id__in=collection_ids)
        serializer = CollectionWriteSerializer(collections, many=True)
        return Response({"collections": serializer.data})

    @action(methods=['GET'], detail=False, url_path='collections-from-nested-list')
    def collections_from_nested_list(self, request):
        nested_list = request.query_params
        nested_collection_ids = [values for values in nested_list.values()]
        names = []
        for collection_ids in nested_collection_ids:
            if len(collection_ids) != 0:
                collection_ids = str(collection_ids).strip('[]').split(',')
                collection_ids = [int(i) for i in collection_ids]
            collections = Collection.objects.filter(id__in=collection_ids)
            serializer = CollectionWriteSerializer(collections, many=True)
            names.append(serializer.data)
        # break down the collection's serializer.data and just get the name (could be refactored in future by removing names)
        names = [[item['name'] for item in sublist] for sublist in names]
        return Response({"collection": names})
    
    @action(methods=['post'], detail=False, url_path='copy-collection')
    def copy_collection(self, request):
        collection_id = request.data.get("collection_id")
        new_name = request.data.get("name")
        original_collection = get_object_or_404(Collection, pk=collection_id)
        if not new_name:
            new_name = f"{original_collection.name} (Copy)"
        new_collection = {
            "name": new_name,
            "platform": original_collection.platform,
        }
        associations = original_collection.source_set.all()
        serializer = CollectionWriteSerializer(data=new_collection)
        try:
            serializer.is_valid(raise_exception=True)
            new_collection = serializer.save()
            for source in associations:
                new_collection.source_set.add(source)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # NOTE!!!! returns a "Task" object! Maybe belongs in a TaskView??
    @action(methods=['post'], detail=False, url_path='rescrape-collection')
    def rescrape_feeds(self, request):
        collection_id = int(request.data["collection_id"])
        return Response(schedule_scrape_collection(collection_id, request.user))


def _rss_fetcher_api():
    return RssFetcherApi(RSS_FETCHER_URL, RSS_FETCHER_USER, RSS_FETCHER_PASS)

class FeedsViewSet(viewsets.ModelViewSet):
    queryset = Feed.objects.all()
    permission_classes = [
        IsGetOrIsStaffOrContributor
    ]
    serializer_class = FeedSerializer

    # overriden to support filtering all endpoints
    def get_queryset(self):
        queryset = super().get_queryset()
        source_id = self.request.query_params.get("source_id")
        if source_id is not None:
            # validation: should throw a ValueError back up the chain
            source_id = int(source_id)
            queryset = queryset.filter(source_id=source_id)
        # the rss-fetcher wants to know which feeds were changed since last time it checked
        modified_since = self.request.query_params.get(
            "modified_since")  # in epoch times
        if modified_since is not None:
            # validation: should throw a ValueError back up the chain
            modified_since = float(modified_since)
            modified_since = dt.datetime.fromtimestamp(modified_since)
            queryset = queryset.filter(modified_at__gte=modified_since)
        # passed a "now" value returned by /api/version
        modified_before = self.request.query_params.get(
            "modified_before")  # in epoch times
        if modified_before is not None:
            # validation: should throw a ValueError back up the chain
            modified_before = float(modified_before)
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
        with _rss_fetcher_api() as rss:
            return Response({"feeds": rss.source_feeds(source_id)})

    @action(detail=False, url_path='feed-details')
    def feed_details(self, request):
        feed_id = int(self.request.query_params.get("feed_id"))
        with _rss_fetcher_api() as rss:
            return Response({"feed": rss.feed(feed_id)})

    @action(detail=False)
    def stories(self, request):
        feed_id = self.request.query_params.get("feed_id", None)
        source_id = self.request.query_params.get("source_id", None)

        with _rss_fetcher_api() as rss:
            if feed_id is not None:
                stories = rss.feed_stories(int(feed_id))

            if source_id is not None:
                stories = rss.source_stories(int(source_id))

        return Response({"stories": stories})

    @action(detail=False)
    def history(self, request):
        feed_id = int(self.request.query_params.get("feed_id"))
        with _rss_fetcher_api() as rss:
            feed_history = rss.feed_history(feed_id)
            feed_history = sorted(
                feed_history, key=lambda d: d['created_at'], reverse=True)
            return Response({"feed": feed_history})

    @action(detail=False)
    def fetch(self, request):
        feed_id = self.request.query_params.get("feed_id", None)
        source_id = self.request.query_params.get("source_id", None)
        total = 0
        with _rss_fetcher_api() as rss:
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
        IsGetOrIsStaffOrContributor
    ]
    serializers_by_action = {
        'default': SourceSerializer,
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
            # validation: should throw a ValueError back up the chain
            collection_id = int(collection_id)
            queryset = queryset.filter(collections__id=collection_id)
        platform = self.request.query_params.get("platform")
        if platform is not None:
            # TODO: check if the platform is a valid option
            if platform == 'onlinenews':
                queryset = queryset.filter(platform='online_news')
            else:
                queryset = queryset.filter(platform=platform)
        name = self.request.query_params.get("name")
        if name is not None:
            queryset = queryset.filter(
                Q(name__icontains=name) | Q(label__icontains=name))
        return queryset

    def create(self, request):
        cleaned_data = Source._clean_source(request.data)
        if cleaned_data:
            serializer = SourceSerializer(
                data=cleaned_data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response({"source": serializer.data})
            else:
                error_string = str(serializer.errors)
                raise APIException(f"{error_string}")
        else:
            raise APIException("No homepage, homepage required")

    def partial_update(self, request, pk=None):
        instance = self.get_object()
        serializer = SourceSerializer(instance, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"source": serializer.data})
        else:
            error_string = serializer.errors
            raise APIException(f"{error_string}")

    @action(methods=['post'], detail=False)
    def upload_sources(self, request):
        collection = Collection.objects.get(pk=request.data['collection_id'])
        rescrape = request.data['rescrape']
        email_title = "Updating collection {}".format(collection.name)
        email_text = ""
        queryset = Source.objects
        counts = dict(updated=0, skipped=0, created=0)
        row_num = 0
        for row in request.data['sources']:
            row_num += 1
            # skip empty rows
            if len(row.keys()) < 1:
                continue
            homepage = row.get('homepage', None)
            if not homepage:
                email_text += "\n Homepage is required"
                counts['skipped'] += 1
                continue
            platform = row.get('platform', Source.SourcePlatforms.ONLINE_NEWS)
            if not platform:
                platform = Source.SourcePlatforms.ONLINE_NEWS
            # check if this is an update
            id = row.get('id', None)
            if id and (int(id) > 0):
                existing_source = queryset.filter(pk=row['id'])
            else:
                #check if url_search_string_source
                url_search_string = row.get('url_search_string', None)
                if not url_search_string:
                    url_search_string = None
                if url_search_string:
                    existing_source = queryset.filter(url_search_string=url_search_string)
                # if online news, need to make check if canonical domain exists
                elif platform == Source.SourcePlatforms.ONLINE_NEWS:
                    canonical_domain = urls.canonical_domain(homepage)
                    # call filter here, not get, so we can check for multiple matches (url_query_string case)
                    existing_source = queryset.filter(
                        name=canonical_domain, platform=Source.SourcePlatforms.ONLINE_NEWS)
                else:
                    # a diff platform, so just check for unique name (ie. twitter handle, subreddit name, YT channel)
                    existing_source = queryset.filter(
                        homepage=row['homepage'], platform=platform)
            # Making a new one
            if len(existing_source) == 0:
                cleaned_source_input = Source._clean_source(row)
                serializer = SourceSerializer(data=cleaned_source_input)
                if serializer.is_valid():
                    existing_source = serializer.save()
                    if rescrape:
                        schedule_scrape_source(
                            existing_source.id, request.user)
                    email_text += "\n {}: created new {} source".format(
                        existing_source.name, existing_source.platform)
                    counts['created'] += 1
                else:
                    serializer_errors = format_serializer_errors(serializer.errors)
                    email_text += f"\n ⚠️Row {row_num}: {cleaned_source_input['name']}, {serializer_errors}"
                    counts['skipped'] += 1
                    continue
                # existing_source = Source.create_from_dict(row)
            # Updating unique match
            elif len(existing_source) == 1:
                existing_source = existing_source[0]
                cleaned_source_input = Source._clean_source(row)
                serializer = SourceSerializer(
                    existing_source, data=cleaned_source_input)
                if serializer.is_valid():
                    existing_source = serializer.save()
                    email_text += "\n Row {}: {}, updated existing {} source".format(
                        row_num, existing_source.name, existing_source.platform)
                    counts['updated'] += 1
                else:
                    serializer_errors = format_serializer_errors(serializer.errors)
                    email_text += f"\n ⚠️Row {row_num}: {cleaned_source_input['name']}, {serializer_errors}"
                    counts['skipped'] += 1
                    continue
                # existing_source.update_from_dict(row)
            # Request to update non-unique match, so skip and force them to do it by hand
            else:
                email_text += "\n ⚠️ Row {}: {}, multiple matches - cowardly skipping so you can do it by hand existing source".\
                    format(row_num, row["homepage"])
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
                    yield (['id', 'homepage', 'domain', 'url_search_string', 'label', 'notes', 'platform',
                            'pub_country','pub_state','media_type','stories_per_week', 'first_story',  
                            'primary_language' ])
                yield ([source.id, source.homepage, source.name, source.url_search_string, source.label,
                         source.notes, source.platform, source.pub_country, source.pub_state, source.media_type, 
                        source.stories_per_week, source.first_story,  source.primary_language])
                first_page = False

        filename = "Collection-{}-{}-sources-{}".format(
            collection_id, collection.name, _filename_timestamp())
        streamer = csv_stream.CSVStream(filename, data_generator)
        return streamer.stream()

    @action(methods=['GET'], detail=False, url_path='sources-from-list')
    def sources_from_list(self, request):
        source_ids = request.query_params.get('s', None)  # decode
        if len(source_ids) != 0:
            source_ids = source_ids.split(',')
            source_ids = [int(i) for i in source_ids if i.isnumeric()]
        sources = Source.objects.filter(id__in=source_ids)
        serializer = SourceSerializer(sources, many=True)
        return Response({"sources": serializer.data})

    # NOTE!!!! returns a "Task" object! Maybe belongs in a TaskView??
    @action(methods=['post'], detail=False, url_path='rescrape-feeds')
    def rescrape_feeds(self, request):
        # maybe take multiple ids?  Or just add a method to rescrape a source
        source_id = int(request.data["source_id"])
        return Response(schedule_scrape_source(source_id, request.user))

    # NOTE!!!! {completed,pending}-tasks are ***NOT***
    # directory/sources specific (list all background tasks)!!

    # returns list of CompletedTasks (maybe belongs in a CompletedTaskView?)
    @action(detail=False, url_path='completed-tasks')
    def completed_tasks(self, request):
        """
        Returns completed tasks for the current user.
        """
        # lists all tasks for user (None lists all tasks)
        return Response(get_completed_tasks(request.user))

    # returns list of Tasks (maybe belongs in a TaskView?)
    @action(detail=False, url_path='pending-tasks')
    def pending_tasks(self, request):
        """
        Returns pending tasks for the current user.
        """
        # lists all tasks for user (None lists all tasks)
        return Response(get_pending_tasks(request.user))


class SourcesCollectionsViewSet(viewsets.ViewSet):

    permission_classes = [
        IsGetOrIsStaffOrContributor
    ]

    def retrieve(self, request, pk=None):
        collection_bool = request.query_params.get('collection')
        if (collection_bool == 'true'):
            collections_queryset = Collection.objects.all()
            collection = get_object_or_404(collections_queryset, pk=pk)
            source_associations = collection.source_set.all()
            serializer = SourceSerializer(source_associations, many=True)
            return Response({'sources': serializer.data})
        else:
            sources_queryset = Source.objects.all()
            source = get_object_or_404(sources_queryset, pk=pk)
            collection_associations = source.collections.all()
            serializer = CollectionWriteSerializer(
                collection_associations, many=True)
            return Response({'collections': serializer.data})

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

def format_serializer_errors(errors):
    error_messages = []
    for field, error_list in errors.items():
        for error in error_list:
            error_messages.append(f"{field}: {error}")
    return "\n".join(error_messages)