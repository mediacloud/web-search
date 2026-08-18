"""
Command to test conversion of source & collection ids into domains and url_search_strings
"""

import logging
import time

from django.core.management.base import BaseCommand

from ...read_requests import parse_requests

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Test source/collection id conversion to search params'

    def add_arguments(self, parser):
        # XXX take provider name??

        # NOTE! nargs="*" means "takes multiple values after the option",
        # not accept multiple invocations of the option!!!!
        parser.add_argument("file")

    def handle(self, *args, **options):
        ss_cache = {}
        reqs = parse_requests(fname=options["file"], srcs=True, ss_cache=ss_cache, status=200)
        for req in reqs:
            print(req)
