from http import HTTPStatus
from django.http import HttpResponse

class HttpResponseUnprocessableEntity(HttpResponse):
	status_code = HTTPStatus.UNPROCESSABLE_CONTENT


class HttpResponseRatelimited(HttpResponse):
    status_code = HTTPStatus.TOO_MANY_REQUESTS
