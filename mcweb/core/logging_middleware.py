import logging
from django.utils.timezone import now
from django.core.cache import cache
from django.db import models
import time

from backend.search.utils import parse_query
from .utils import get_config_value

request_logger = logging.getLogger("request_logger")

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        start_time = time.time()
        response = self.get_response(request)
        duration = time.time() - start_time

        #Check if logging is enabled (with caching to reduce database hits)
        request_logging_enabled = cache.get("request_logging_enabled")
        if request_logging_enabled is None:
            # Retrieve from database if not in cache
            request_logging_enabled = get_config_value('obs','request_logging_enabled')
            cache.set("request_logging_enabled", request_logging_enabled, timeout=60)  # Cache for 60 seconds

        if(request_logging_enabled):
            # Check if user is authenticated and add user data
            user = request.user if request.user.is_authenticated else "Anonymous"
            ip = request.META.get('REMOTE_ADDR')

            #General incantation for request params-- maybe more dedicated parsing would eventually be 
            #preferable for grabbing query terms, but this will do for now.
            try:
                request_params = parse_query(request)
            except ValueError:
                request_params = request.GET.get("q", '')    

            # Log the request details
            request_logger.info(
                f"{now()} - Method: {request.method}, Path: {request.path}, User: {user}, Duration: {duration:.4f} s, "
                f"IP: {request.META.get('REMOTE_ADDR')}, Params: {request_params}"
            )
        return response


