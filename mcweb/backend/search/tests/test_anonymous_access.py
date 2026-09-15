from django.test import TestCase


class AnonymousAccessSearchApiTest(TestCase):
    """
    Every one of these endpoints is gated by DRF's IsAuthenticated permission
    (either explicitly via @permission_classes, or via the project-wide
    REST_FRAMEWORK DEFAULT_PERMISSION_CLASSES). None of them had a test
    confirming anonymous requests are actually rejected.
    """

    # endpoints reachable with a bare GET and no query params: DRF's
    # permission check runs before the view body, so these are rejected
    # before parse_query would ever complain about missing params.
    GET_URLS = [
        "/api/search/total-count",
        "/api/search/sample",
        "/api/search/words",
        "/api/search/count-over-time",
        "/api/search/count-by-source-over-interval",
        "/api/search/story",
        "/api/search/languages",
        "/api/search/sources",
        "/api/search/story-list",
        "/api/search/providers",
        "/api/search/requests",
    ]

    def test_anonymous_requests_are_rejected(self):
        for url in self.GET_URLS:
            with self.subTest(endpoint=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 401)
