import logging
from django.utils.timezone import now
from django.core.cache import cache
from django.db import models
import time

from backend.search.utils import parse_query
from .utils import get_config_value

import json
request_logger = logging.getLogger("request_logger")

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        start_time = time.time()
        response = self.get_response(request)
        duration = time.time() - start_time

        #Check if logging is enabled (with caching to reduce database hits)
        request_logging_enabled = get_property_value('obs','request_logging_enabled')

        if(request_logging_enabled):
            # Check if user is authenticated and add user data
            log_msg = {}
            log_msg['user'] = str(request.user)if request.user.is_authenticated else "Anonymous"
            log_msg['ip'] = request.META.get('REMOTE_ADDR')

            #General incantation for request params-- maybe more dedicated parsing would eventually be 
            #preferable for grabbing query terms, but this will do for now.
            if request.method == 'POST':
                request_params = json.loads(request.body)
            elif request.method == 'GET':
                request_params = request.GET
            else:
                request_params = {}

            log_msg["method"] = request.method
            log_msg["params"] = request_params
            log_msg["duration"] = duration
            log_msg["request_time"] = start_time
            # Log the request details
            request_logger.info(log_msg)
        return response


