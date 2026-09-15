from django.test.runner import DiscoverRunner

from settings import BASE_DIR


class ProjectDiscoverRunner(DiscoverRunner):
    """
    `mcweb/__init__.py` has to exist (production's wsgi.py and settings.py
    both import things as `mcweb.X`), but that same file makes plain
    `python manage.py test` (no args) break: unittest's discovery ends up
    treating the repo root (one level above mcweb/) as the top-level
    package directory, so every test module gets imported twice -- once as
    `backend.x` (via sys.path, added because manage.py lives in mcweb/)
    and once as `mcweb.backend.x` (via discovery) -- and Django's app
    registry rejects the second one as not belonging to any installed app.

    Pinning `top_level` to BASE_DIR (mcweb/ itself) unless the caller
    already specified one (e.g. via --top-level-directory) makes discovery
    match what's already on sys.path, so this only ever needs setting once
    here rather than every test invocation remembering a flag.

    Also default unlabeled discovery to BASE_DIR itself (an absolute path)
    rather than unittest's "." default, so this works regardless of the
    caller's current working directory -- "." resolves against cwd, so
    running `python manage.py test` from outside mcweb/ would otherwise
    still break (either the same double-import, or "Start directory is
    not importable" if cwd isn't a package at all).
    """

    def __init__(self, *args, top_level=None, **kwargs):
        if top_level is None:
            top_level = str(BASE_DIR)
        super().__init__(*args, top_level=top_level, **kwargs)

    def build_suite(self, test_labels=None, extra_tests=None, **kwargs):
        test_labels = test_labels or [str(BASE_DIR)]
        return super().build_suite(test_labels, extra_tests, **kwargs)
