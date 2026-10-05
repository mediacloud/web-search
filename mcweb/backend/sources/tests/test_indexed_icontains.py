from django.test import TestCase

from backend.sources.models import Source

# registers the IndexedIContains ("iicontains") lookup as a side effect
import backend.sources.api  # noqa: F401


class IndexedIContainsTest(TestCase):
    """
    IndexedIContains (backend/sources/api.py) is a custom Lookup that emits
    ILIKE instead of UPPER(...) LIKE UPPER(...) so Postgres can use the
    trigram GIN index on Source.name/label -- the difference between a
    sub-50ms source search and a 2.5s one.

    It builds its own params in as_sql(), which is exactly the API that
    changed in Django 6.0: process_lhs()/process_rhs() now return params as
    tuples rather than lists, and as_sql() is required to return a tuple.
    The pre-6.0 body did `rhs_params[0] = ...`, which raises
    "TypeError: 'tuple' object does not support item assignment" under
    Django 6.x. That failure is at query-compile time, so it is invisible to
    system checks and only shows up when a search actually runs.
    """

    @classmethod
    def setUpTestData(cls):
        cls.example = Source.objects.create(
            name="Example.COM", label="The Example Times")
        cls.other = Source.objects.create(
            name="other.org", label="Other Gazette")

    def test_emits_ilike(self):
        """The whole point of the lookup: ILIKE, not UPPER(...) LIKE."""
        sql = str(Source.objects.filter(name__iicontains="example").query)
        self.assertIn("ILIKE", sql)
        self.assertNotIn("UPPER", sql)

    def test_matches_case_insensitively(self):
        """Compiles and executes against Postgres, and is case-insensitive."""
        self.assertEqual(
            [s.name for s in Source.objects.filter(name__iicontains="EXAMPLE")],
            ["Example.COM"])
        self.assertEqual(
            [s.name for s in Source.objects.filter(name__iicontains="example")],
            ["Example.COM"])

    def test_matches_substring_not_just_prefix(self):
        """The lookup wraps the term in % on both sides."""
        self.assertEqual(
            [s.label for s in Source.objects.filter(label__iicontains="example")],
            ["The Example Times"])

    def test_non_matching_term_returns_nothing(self):
        self.assertEqual(
            Source.objects.filter(name__iicontains="nomatch").count(), 0)

    def test_combines_with_other_filters(self):
        """
        api.py ORs several iicontains terms together and unions the result,
        so the lookup has to survive being one node in a larger query.
        """
        from django.db.models import Q
        qs = Source.objects.filter(
            Q(name__iicontains="example") | Q(label__iicontains="gazette"))
        self.assertEqual(
            sorted(s.name for s in qs), ["Example.COM", "other.org"])

    def test_as_sql_returns_tuple_params(self):
        """
        Django 6.0 requires as_sql() to return params as a tuple. Assert it
        directly so a regression is reported here rather than as an opaque
        TypeError from deep inside the query compiler.
        """
        query = Source.objects.filter(name__iicontains="example").query
        compiler = query.get_compiler(using="default")
        lookup = query.where.children[0]
        sql, params = lookup.as_sql(compiler, compiler.connection)
        self.assertIsInstance(params, tuple)
        self.assertEqual(params, ("%example%",))
        self.assertIn("ILIKE", sql)
