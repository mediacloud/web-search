from django.core.cache import cache
from django.test import SimpleTestCase

from .cache import cached_function_call, mc_providers_cacher


class CachedFunctionCallTest(SimpleTestCase):
    def setUp(self):
        cache.clear()
        self.calls = []

    def _fn(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        return f"result-{len(self.calls)}"

    def test_first_call_is_a_miss_and_invokes_the_function(self):
        result, was_cached = cached_function_call(self._fn, "prefix", 60, "a")

        self.assertEqual(result, "result-1")
        self.assertFalse(was_cached)
        self.assertEqual(len(self.calls), 1)

    def test_second_call_with_identical_args_is_a_hit_and_skips_the_function(self):
        cached_function_call(self._fn, "prefix", 60, "a")
        result, was_cached = cached_function_call(self._fn, "prefix", 60, "a")

        self.assertEqual(result, "result-1")
        self.assertTrue(was_cached)
        self.assertEqual(len(self.calls), 1)

    def test_different_kwargs_produce_different_cache_entries(self):
        cached_function_call(self._fn, "prefix", 60, x=1)
        result, was_cached = cached_function_call(self._fn, "prefix", 60, x=2)

        self.assertFalse(was_cached)

    def test_set_kwargs_are_order_independent(self):
        """
        Set-valued kwargs (e.g. domains) are normalized to sorted lists
        specifically so two calls carrying "the same" set built in a
        different way still land on the same cache entry.
        """
        cached_function_call(self._fn, "prefix", 60, domains={"a", "b", "c"})
        result, was_cached = cached_function_call(self._fn, "prefix", 60, domains=set(["c", "b", "a"]))

        self.assertTrue(was_cached)
        self.assertEqual(len(self.calls), 1)

class McProvidersCacherTest(SimpleTestCase):
    def setUp(self):
        cache.clear()
        self.calls = []

    def _fn(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        return "value"

    def test_cache_seconds_kwarg_is_consumed_and_not_passed_to_the_function(self):
        mc_providers_cacher(self._fn, "prefix", "a", _cache_seconds=30)

        self.assertEqual(self.calls, [(("a",), {})])
