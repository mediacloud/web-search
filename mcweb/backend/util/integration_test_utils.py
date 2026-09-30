"""
Shared helper for the live-ES/live-network integration test suites in
backend/*/integration_tests/.

Those tests hit a real Elasticsearch backend (and, for the source-rescrape
test, the live internet) instead of mocking mc_providers -- see each test
module's docstring for what's exercised and how to run it. They run
against the normal local/scratch Postgres test database like any other
Django test; only the ES queries and network fetches are real. They are
always skipped unless RUN_INTEGRATION_TESTS=1 is set, so plain `manage.py
test` (what CI runs) never executes them.
"""
import os
import unittest

RUN_INTEGRATION_TESTS = os.environ.get("RUN_INTEGRATION_TESTS") == "1"

skip_unless_live_integration = unittest.skipUnless(
    RUN_INTEGRATION_TESTS,
    "set RUN_INTEGRATION_TESTS=1 to run tests against a live ES backend/network",
)
