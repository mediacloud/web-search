from rest_framework.test import APITestCase


class AnonymousAccessSourcesApiTest(APITestCase):
    """
    All of these viewsets are gated by IsGetOrIsStaffOrContributor, which
    requires an authenticated user even for GET. None of them had a test
    confirming anonymous requests are actually rejected.
    """

    LIST_URLS = [
        "/api/sources/collections/",
        "/api/sources/feeds/",
        "/api/sources/sources/",
        "/api/sources/alternative-domains/",
    ]

    def test_anonymous_list_requests_are_rejected(self):
        for url in self.LIST_URLS:
            with self.subTest(endpoint=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 401)

    def test_anonymous_sources_collections_detail_request_is_rejected(self):
        response = self.client.get("/api/sources/sources-collections/1/")
        self.assertEqual(response.status_code, 401)
