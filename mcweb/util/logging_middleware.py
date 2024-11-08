import logging
from django.utils.timezone import now

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Check if user is authenticated and add user data
        user = request.user if request.user.is_authenticated else "Anonymous"
        api_token = request.META.get("HTTP_AUTHORIZATION", "No Token")
        logger.info(user)
        # Log the request details
        logger.info(
            f"{now()} - Method: {request.method}, Path: {request.path}, User: {user}, "
            f"API Token: {api_token}, IP: {request.META.get('REMOTE_ADDR')}"
        )
        return response