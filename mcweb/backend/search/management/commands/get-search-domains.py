"""
Command to test conversion of source & collection ids into domains and url_search_strings
"""

import logging
import time

from django.core.management.base import BaseCommand
from django.db import connection

# mcweb:
import settings
from backend.search.utils import _for_media_cloud

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Test source/collection id conversion to search params'

    def add_arguments(self, parser):
        # XXX take provider name??

        # NOTE! nargs="*" means "takes multiple values after the option",
        # not accept multiple invocations of the option!!!!
        parser.add_argument("--collection", "-c", type=int, nargs="*", default=[])
        parser.add_argument("--src", "-s", type=int, nargs="*", default=[])
        parser.add_argument("--sql", action="store_true",
                            help="enable SQL display")

    def handle(self, *args, **options):
        if options["sql"]:
            # either set should cause queries_logged property to return True:
            settings.DEBUG = connection.force_debug_cursor = options["sql"]
            logging.getLogger("django.db.backends").setLevel(logging.DEBUG)

        colls = options["collection"]
        srcs = options["src"]

        print("collections", colls)
        print("sources", srcs)

        t0 = time.monotonic()
        # XXX pass all_params values and check for them in output??
        res = _for_media_cloud(collections=colls, sources=srcs, all_params={})
        t = time.monotonic() - t0

        doms = res.get("domains", [])
        if doms:
            print("domains", doms)

        uss = res.get("url_search_strings",{})
        if uss:
            print("url_search_strings:")
            for k, v in uss.items():
                print(k, v)

        print(f"in {t:.6f} seconds")
