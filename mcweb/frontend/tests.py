from django.test import TestCase


class IndexViewSmokeTest(TestCase):
    """
    index() is the entry point for the whole SPA: it builds a fairly large
    template context (version/providers/analytics/Sentry config, a cached
    MetadataUpdateTask lookup, a constance-backed system alert with a
    settings fallback) and is wrapped in @ensure_csrf_cookie. It had zero
    test coverage -- not even a plain "does / return 200" check. This
    matters for a Django version bump because a break here (e.g. in
    render()/@ensure_csrf_cookie internals) would take down the entire
    frontend, not just one API endpoint.
    """

    def test_root_path_renders(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "frontend/index.html")

    def test_sets_csrf_cookie(self):
        response = self.client.get("/")

        self.assertIn("csrftoken", response.cookies)

    def test_context_includes_expected_keys(self):
        response = self.client.get("/")

        for key in (
            "version", "providers", "all_urls_csv_email_max", "all_urls_csv_email_min",
            "earliest_available_date", "system_alert", "sentry_config", "last_metadata_updates",
        ):
            with self.subTest(key=key):
                self.assertIn(key, response.context)

    def test_unmatched_path_also_renders_via_catch_all(self):
        # mcweb/urls.py has a catch-all re_path routing any unmatched
        # frontend route (e.g. client-side React Router paths) to this
        # same index view.
        response = self.client.get("/search")

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "frontend/index.html")
