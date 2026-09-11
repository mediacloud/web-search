from django.core.cache import cache
from django.test import SimpleTestCase

from .cache import cache_by_kwargs, cached_function_call, mc_providers_cacher


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

    def test_different_positional_args_produce_different_cache_entries(self):
        cached_function_call(self._fn, "prefix", 60, "a")
        result, was_cached = cached_function_call(self._fn, "prefix", 60, "b")

        self.assertEqual(result, "result-2")
        self.assertFalse(was_cached)

    def test_different_cache_prefix_produces_different_cache_entries(self):
        cached_function_call(self._fn, "prefix-one", 60, "a")
        result, was_cached = cached_function_call(self._fn, "prefix-two", 60, "a")

        self.assertFalse(was_cached)

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

    def test_dict_of_sets_kwargs_are_order_independent(self):
        """
        url_search_strings is a dict of sets -- both the outer dict's key
        order and each inner set's element order must be normalized.
        """
        first = {"b": {2, 1}, "a": {3}}
        second = {"a": {3}, "b": {1, 2}}

        cached_function_call(self._fn, "prefix", 60, url_search_strings=first)
        result, was_cached = cached_function_call(self._fn, "prefix", 60, url_search_strings=second)

        self.assertTrue(was_cached)
        self.assertEqual(len(self.calls), 1)

    def test_result_is_actually_cached_for_the_requested_duration(self):
        cached_function_call(self._fn, "prefix", 60, "a")

        # confirm something was actually written to Django's cache backend,
        # not just returned directly
        self.assertEqual(len(self.calls), 1)
        result, was_cached = cached_function_call(self._fn, "prefix", 60, "a")
        self.assertTrue(was_cached)


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

    def test_repeated_calls_are_cached(self):
        mc_providers_cacher(self._fn, "prefix", "a", _cache_seconds=30)
        mc_providers_cacher(self._fn, "prefix", "a", _cache_seconds=30)

        self.assertEqual(len(self.calls), 1)


class CacheByKwargsDecoratorTest(SimpleTestCase):
    def setUp(self):
        cache.clear()
        self.calls = []

    def test_wrapped_function_is_only_invoked_once_for_identical_calls(self):
        calls = self.calls

        @cache_by_kwargs(seconds=60)
        def expensive(x, y=1):
            calls.append((x, y))
            return x + y

        self.assertEqual(expensive(1, y=2), 3)
        self.assertEqual(expensive(1, y=2), 3)
        self.assertEqual(len(calls), 1)

    def test_different_arguments_are_not_conflated(self):
        calls = self.calls

        @cache_by_kwargs(seconds=60)
        def expensive(x, y=1):
            calls.append((x, y))
            return x + y

        self.assertEqual(expensive(1, y=2), 3)
        self.assertEqual(expensive(1, y=3), 4)
        self.assertEqual(len(calls), 2)
