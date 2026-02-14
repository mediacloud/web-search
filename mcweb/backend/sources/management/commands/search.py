"""
Created in March 2025 as a development environment for keyword search,
Gutted in Feb 2026 to use CollectionViewSet and SourcesViewSet
so this can be used to test the REAL code!!
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

        # https://search.mediacloud.org/api/sources/sources/?limit=100&name=york+times+new
        src_req = factory.get(f'/sources/sources/?limit=100&name={tokens}')

        # default user (system-task) is NOT marked as staff!
        user = User.objects.get(username=options["user"])
        if not user.is_staff:
            print("NOTE!! user", user.username, "is *NOT* a staff user, and will only see public collections!!!")

        force_authenticate(src_req, user=user)

        src_view = SourcesViewSet.as_view(actions={'get': 'list'})

        print("Sources")
        t0 = time.monotonic()
        src_resp = src_view(src_req)
        t1 = time.monotonic()
        if src_resp.status_code == 200:
            d = src_resp.data
            for r in d["results"]:
                alt = ",".join(a["domain"] for a in r["alternative_domains"])
                if alt:
                    alt = "alternates: " + alt
                print(r["id"], ">>", r["name"], ">>", r["label"], ">>", alt, "in", r["collection_count"], "collections")
            print("count", d["count"], "next", d["next"], "prev", d["previous"], "len", len(d["results"]))
        else:
            print("response", src_resp.status_code)
        print(f"{(t1 - t0):.6f} seconds", )
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

        if coll_resp.status_code == 200:
            d = coll_resp.data
            for r in d["results"]:
                if r["public"]:
                    private = ""
                else:
                    private = "(private)"
                print(r["id"], ">>", r["name"], private, ">>", r["source_count"], "srcs")
            print("count", d["count"], "next", d["next"], "prev", d["previous"], "len", len(d["results"]))
        else:
            print("response", coll_resp.status_code)
        print(f"{(t1 - t0):.6f} seconds", )
        print("")
