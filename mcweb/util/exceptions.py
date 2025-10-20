from http import HTTPStatus
from django.http import HttpResponse

class HttpResponseUnprocessableEntity(HttpResponse):
	status_code = HTTPStatus.UNPROCESSABLE_ENTITY #HTTP 422 - Backwards compatible name 



class HttpResponseRatelimited(HttpResponse):
    status_code = HTTPStatus.TOO_MANY_REQUESTS #HTTP 429


class UserValueError(ValueError):
		
	"""
	Exception raised for bad input to the api, to trigger a 422 response from the server. 
	Should occur in only very tightly scoped situations, so no need for additional code here. 
	"""
