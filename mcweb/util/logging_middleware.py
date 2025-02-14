import logging
import time
import datetime as dt
from constance import config
from io import BytesIO

import json

import util.stats

request_logger = logging.getLogger("request_logger")

# prevent request messages from "bleeding"
# (in the color/audio sense) into root logger
request_logger.propagate = False

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        log_msg = {}

        #Check if logging is enabled (with caching to reduce database hits)
        request_logging_enabled = config.REQUEST_LOGGING_ENABLED
        
        #get the request.body before the view executes and reset it
        if(request_logging_enabled):
            if request.method == 'POST':
                if request.content_type == "application/json":
                    try:
                        #The request.body is a stream that can only be read once.
                        # this resets the stream after reading it so that downstream views are unaffected
                        request_data = request.body 
                        log_msg['request_params'] = json.loads(request_data)
                        if "password" in log_msg["request_params"]:
                            log_msg["request_params"]["password"] = "*****"
                        request._stream = BytesIO(request_data)
                    except json.JSONDecodeError:
                        log_msg["request_params"] = "Invalid JSON"
                        
                elif request.content_type == "application/x-www-form-urlencoded":
                    log_msg["request_params"] = request.POST  # Handles form-encoded data

            elif request.method == 'GET':
                log_msg["request_params"] = request.GET


        start_time = time.time()
        response = self.get_response(request)
        duration = time.time() - start_time

        if(request_logging_enabled):
            # Check if user is authenticated and add user data
            log_msg["timestamp"] = dt.datetime.utcnow().isoformat() 
            log_msg['user'] = str(request.user)if request.user.is_authenticated else "Anonymous"
            log_msg['ip'] = request.META.get('REMOTE_ADDR')


            log_msg["method"] = request.method
            log_msg["path"] = request.path
            log_msg["duration"] = duration
            
            exclude_headers = ["Cookie", "X-Csrftoken"]
            log_msg["headers"] = {key: value for key, value in request.headers.items() if key not in exclude_headers}
            log_msg["has_session"] = "sessionid" in request.headers.get("Cookie", {})

            log_msg["response"] = {
                "code": response.status_code,
                "reason": response.reason_phrase,
            }

            # Log the request details
            try:
                log_dump = json.dumps(log_msg)
                request_logger.info(json.dumps(log_msg))
            except TypeError:
                pass

        util.stats.path_stats(request.path, duration, response.status_code)

        return response


