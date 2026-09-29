"""
Command to test conversion of source & collection ids into domains and url_search_strings
"""

import logging
import time

from django.core.management.base import BaseCommand

from ...read_requests import parse_requests, make_table, SrcCountCache

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Test source/collection id conversion to search params'

    def add_arguments(self, parser):
        # XXX take provider name??

        # NOTE! nargs="*" means "takes multiple values after the option",
        # not accept multiple invocations of the option!!!!
        parser.add_argument("--html", action="store_true")
        parser.add_argument("file")

    def handle(self, *args, **options):
        sc_cache: SrcCountCache = {}
        reqs = parse_requests(fname=options["file"], srcs=True, sc_cache=sc_cache, status=200)
        if options["html"]:
            print(make_table(reqs))
        else:
            for req in reqs:
                print(req)
