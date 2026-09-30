import json
from unittest.mock import patch

from django.contrib.auth.models import AnonymousUser
from django.http import HttpResponse
from django.test import RequestFactory, SimpleTestCase

from .logging_middleware import RequestLoggingMiddleware, request_logger


def _json_post(body: dict):
    return RequestFactory().post(
        "/some/path", data=json.dumps(body), content_type="application/json")


class RequestLoggingMiddlewareDisabledTest(SimpleTestCase):
    """
    When REQUEST_LOGGING_ENABLED is False (the default), the middleware is
    meant to be a complete passthrough. This pins that down directly: the
    request body must reach the view fully intact and readable exactly
    once, and nothing should be logged. `config` is mocked entirely rather
    than toggled for real, so this never touches the live (Redis-backed)
    constance value.
    """

    def setUp(self):
        patcher = patch("util.logging_middleware.config")
        self.mock_config = patcher.start()
        self.mock_config.REQUEST_LOGGING_ENABLED = False
        self.addCleanup(patcher.stop)

    def test_json_post_body_reaches_the_view_unmodified(self):
        seen_bodies = []

        def get_response(request):
            seen_bodies.append(json.loads(request.body))
            return HttpResponse("ok")

        middleware = RequestLoggingMiddleware(get_response)
        request = _json_post({"username": "alice", "password": "secret"})

        response = middleware(request)

        self.assertEqual(response.content, b"ok")
        self.assertEqual(seen_bodies, [{"username": "alice", "password": "secret"}])

    def test_form_encoded_post_still_readable_by_the_view(self):
        def get_response(request):
            return HttpResponse(request.POST.get("q", ""))

        middleware = RequestLoggingMiddleware(get_response)
        request = RequestFactory().post("/some/path", {"q": "robots"})

        response = middleware(request)

        self.assertEqual(response.content, b"robots")


class RequestLoggingMiddlewareEnabledTest(SimpleTestCase):
    """
    Contrast case: when enabled, the middleware reads request.body to log
    it, then manually rewinds request._stream (a private Django
    implementation detail, not a public API -- exactly the kind of thing a
    Django version bump could silently change) so the view can still read
    it. Confirms that trick doesn't corrupt or truncate the body, and that
    password redaction only affects the log, never what the view sees.
    """

    def setUp(self):
        patcher = patch("util.logging_middleware.config")
        self.mock_config = patcher.start()
        self.mock_config.REQUEST_LOGGING_ENABLED = True
        self.addCleanup(patcher.stop)

    def _request_with_user(self, request):
        request.user = AnonymousUser()
        return request

    def test_json_post_body_still_reaches_the_view_after_being_read_for_logging(self):
        seen_bodies = []

        def get_response(request):
            seen_bodies.append(json.loads(request.body))
            return HttpResponse("ok")

        middleware = RequestLoggingMiddleware(get_response)
        request = self._request_with_user(_json_post({"username": "alice", "password": "secret"}))

        with self.assertLogs(request_logger, level="INFO"):
            response = middleware(request)

        self.assertEqual(response.content, b"ok")
        self.assertEqual(seen_bodies, [{"username": "alice", "password": "secret"}])

    def test_password_is_redacted_in_the_log_but_not_in_what_the_view_sees(self):
        def get_response(request):
            return HttpResponse(request.body)

        middleware = RequestLoggingMiddleware(get_response)
        request = self._request_with_user(_json_post({"username": "alice", "password": "secret"}))

        with self.assertLogs(request_logger, level="INFO") as captured:
            response = middleware(request)

        self.assertIn('"password": "*****"', captured.output[0])
        self.assertEqual(json.loads(response.content), {"username": "alice", "password": "secret"})

    def test_invalid_json_post_does_not_crash_the_request(self):
        middleware = RequestLoggingMiddleware(lambda request: HttpResponse("ok"))
        request = self._request_with_user(
            RequestFactory().post("/some/path", data="not json", content_type="application/json"))

        with self.assertLogs(request_logger, level="INFO"):
            response = middleware(request)

        self.assertEqual(response.status_code, 200)

