import logging
import time
import datetime as dt
from constance import config

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
        request_logging_enabled = config.REQUEST_LOGGING_ENABLED

        if(request_logging_enabled):
            # Check if user is authenticated and add user data
            log_msg = {}
            log_msg["timestamp"] = dt.datetime.utcnow().isoformat() 
            log_msg['user'] = str(request.user)if request.user.is_authenticated else "Anonymous"
            log_msg['ip'] = request.META.get('REMOTE_ADDR')

            #Just using direct request parameters to grab this now. 
            if request.method == 'POST':
                if request.content_type == "application/json":
                    try:
                        log_msg['request_params'] = json.loads(request.body)
                    except json.JSONDecodeError:
                        pass
                elif request.content_type == "application/x-www-form-urlencoded":
                    log_msg["request_params"] = request.POST  # Handles form-encoded data

            elif request.method == 'GET':
                log_msg["request_params"] = request.GET


            log_msg["method"] = request.method
            log_msg["path"] = request.path
            log_msg["duration"] = duration
            
            exclude_headers = ["Cookie", "X-Csrftoken"]
            log_msg["headers"] = {key: value for key, value in request.headers.items() if key not in exclude_headers}

            # Log the request details
            request_logger.info(json.dumps(log_msg))
        return response


