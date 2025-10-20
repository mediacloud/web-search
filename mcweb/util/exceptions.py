from http import HTTPStatus
from django.http import HttpResponse

class HttpResponseUnprocessableEntity(HttpResponse):
	status_code = HTTPStatus.UNPROCESSABLE_ENTITY #HTTP 422 - Backwards compatible name 



class HttpResponseRatelimited(HttpResponse):
    status_code = HTTPStatus.TOO_MANY_REQUESTS #HTTP 429
