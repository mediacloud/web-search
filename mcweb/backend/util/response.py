"""
common API HTTP response functions for search and source apps
since mediacloud.api.BaseApi class does common error handling

Define specific functions for errors like over_quota and
rate_exceeded, for uniformity.
"""

import json
import traceback as tb
from typing import Type

from django.http import HttpResponseBadRequest, HttpResponse, HttpRequest

TRACE_JSON_RESPONSE = False

def json_response(value: dict | str | None, *, _class: Type[HttpResponse] = HttpResponse) -> HttpResponse:
    """
    Send a generic JSON response.
    It's not intended that _class will be used by individual view
    functions, hence the leading underscore.
    """
    # NOTE! always passing default=str
    j = json.dumps(value, default=str)
    if TRACE_JSON_RESPONSE:
        logger.debug("json_response %d %s", _class.status_code, j)
    return _class(j, content_type="application/json")


def error_response(msg: str, *,
                   # must be passed by keyword:
                   exc: Exception | None = None,
                   request: HttpRequest = None,
                   response_type: Type[HttpResponse] = HttpResponseBadRequest,
                   temporary: bool = False,
                   traceback: bool = False,
                   ) -> HttpResponse:
    """
    NOTE! Optional args all keyword required.

    Passing status code should not be needed: declarations of HttpResponse only differ by
    the status_code class member.  If a different status_code is needed, subclass
    HttpResponse.

    "temporary" means a transient condition.  would like to return a different HTTP
    response code (ie; 503 Service Unavailable) to indicate to API clients the temporary
    nature of the error, but django regards returning anything >= 500 as an internal error
    (logs at ERROR level, which can generate admin emails), so added to JSON response.
    """
    # NOTE! checking "application/json" not in .... causes test failures
    if request and "text/html" in request.headers.get("Accept", ""):
        # request passed by handle_provider_errors and handle_429;
        # try to give legible response in cases where client pops a
        # new window to attempt to start a download.
        #
        # Use a template file, named in a config var?
        if temporary:
            # If `response_type.status_code == 429 could add
            # a meta-refresh tag to reload??
            err = "Temporary error"
        else:
            err = "Error"
        text = (
            "<html>\n"
            f"<head><title>{err}: {msg}</title></head>\n"
            f"<body><h1>{err}: {msg}</h1></body>\n"
            "</html>"
        )
        return response_type(text, content_type="text/html")

    # create JSON for body:
    response = {
        "status": "error",
        "note": msg
    }
    if exc:
        # detailed info (for optional display)
        response["exception"] = repr(exc)

        if traceback:
            # show the file, line number, and the line of code (trying to
            # limit payload and info leakage, if neither is a problem, or
            # this turns out to be flakey, could pass back the entire list):
            response["traceback"] = tb.format_exception(exc)[-2]

    if temporary:
        response["temporary"] = True
    return json_response(response, _class=response_type)


def quota_exceeded(exc: Exception, request: HttpRequest) -> HttpResponse:
    # NOTE! django-smart-ratelimit returns 429 for over quota,
    # which would be clearer than 400 (Bad Request), but that
    # breaks a test!

    # If returning 429, respond w/ temporary=False?
    return error_response(str(exc), exc=exc, request=request)


def rate_exceeded(exc: Exception, request: HttpRequest) -> HttpResponse:
    # return standard format JSON response for
    # mediacloud.error.APIResponseError
    return error_response(
        msg="rate limited",
        request=request,
        response_type=HttpResponseRatelimited, # 429
        temporary=True
    )
