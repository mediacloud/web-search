"""
Created in March 2025 as a development environment for keyword search,
Gutted in Feb 2026 to use CollectionViewSet and SourcesViewSet
(since that's where the real code lives)
"""

import time

from django.contrib.auth.models import User
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.core.management.base import BaseCommand, CommandError
from rest_framework.test import APIRequestFactory, force_authenticate

from settings import SYSTEM_TASK_USERNAME, ALLOWED_HOSTS
from ...models import Collection, Source
from ...api import CollectionViewSet, SourcesViewSet

class Command(BaseCommand):
    help = 'Search sources and collections'

    def add_arguments(self, parser):
        parser.add_argument("--user", default=SYSTEM_TASK_USERNAME, type=str)
        parser.add_argument("token", nargs="+", type=str)

    def handle(self, *args, **options):
        ALLOWED_HOSTS.append("testserver")

        # generic preparation, don't charge for time spent:
        factory = APIRequestFactory()
        tokens = "+".join(options["token"]) # XXX full URL encoding!!
        user = User.objects.get(username=options["user"])

        # https://search.mediacloud.org/api/sources/sources/?limit=100&name=york+times+new
        src_view = SourcesViewSet.as_view(actions={'get': 'list'})
        src_req = factory.get(f'/sources/sources/?limit=100&name={tokens}')
        force_authenticate(src_req, user=user)


        print("Sources")

        t0 = time.monotonic()
        src_resp = src_view(src_req)
        t1 = time.monotonic()
        print(f"{(t1 - t0):.6f} seconds", )
        if src_resp.status_code == 200:
            d = src_resp.data
            print("count", d["count"], "next", d["next"], "prev", d["previous"], "len", len(d["results"]))
            for r in d["results"]:
                print(r["id"], ">>", r["name"], ">>", r["label"], [a["domain"] for a in r["alternative_domains"]])
        else:
            print("response", src_resp.status_code)
        print("")

        ################
        # https://search.mediacloud.org/api/sources/collections/?limit=100&name=york+times+new
        coll_view = CollectionViewSet.as_view(actions={'get': 'list'})
        coll_req = factory.get(f'/sources/collections/?limit=100&name={tokens}')
        force_authenticate(coll_req, user=user)

        print("Collections")
        t0 = time.monotonic()
        coll_resp = coll_view(coll_req)
        t1 = time.monotonic()
        print(f"{(t1 - t0):.6f} seconds", )

        if coll_resp.status_code == 200:
            d = coll_resp.data
            print("count", d["count"], "next", d["next"], "prev", d["previous"], "len", len(d["results"]))
            for r in d["results"]:
                print(r["id"], ">>", r["name"], ">>", r["source_count"], "srcs")
        else:
            print("response", coll_resp.status_code)
        print("")
