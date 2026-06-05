# mcweb/backend/sources/
from django.core.management.base import BaseCommand
from django.db.models import Count

from ...models import Feed, Source


class Command(BaseCommand):
    help = "Find any child sources with feeds and migrate them to the parent source."

    def add_arguments(self, parser):
        parser.add_argument(
            "--max-sources",
            type=int,
            required=True,
            help="Maximum number of child sources to process.",
        )
        parser.add_argument(
            "--dry-run",
            type=lambda v: str(v).lower() in ("true", "1", "yes"),
            default=False,
            help="If true, print the changes that would be made without modifying any feeds.",
        )

    def handle(self, *args, **options):
        max_sources = options["max_sources"]
        dry_run = options["dry_run"]
        child_sources = self._child_sources_with_feeds()[:max_sources]

        prefix = "[dry-run] " if dry_run else ""
        print(f"{prefix}Will look for up to {max_sources} child sources that have feeds (they're NOT supposed to)")
        sources_cleaned = 0
        feeds_moved = 0
        for child in child_sources:
            print(f"{prefix}{child.id}: {child.name} child source ({child.url_search_string}) has {child.feed_count} feeds")
            potential_parents = self._find_potential_parents(child)
            if len(potential_parents) == 0:
                print(f"{prefix}  !!! No parent found for child source {child.id} — skipping")
                continue
            if len(potential_parents) > 1:
                ids = ", ".join(str(p.id) for p in potential_parents)
                print(f"{prefix}  !!! Multiple potential parents found for child source {child.id} ({ids}) — skipping")
                continue

            parent = potential_parents[0]
            print(f"{prefix}  found parent {parent.id} {parent.name}")
            if dry_run:
                moved = Feed.objects.filter(source=child).count()
            else:
                moved = self._move_feeds(child, parent)
            sources_cleaned += 1
            feeds_moved += moved
            print(f"{prefix}  moved {moved} feed(s) to parent {parent.id}")

        print(f"{prefix}Done: fixed {sources_cleaned} child source(s), moved {feeds_moved} feed(s) total")

    def _child_sources_with_feeds(self):
        return (
            Source.objects.exclude(url_search_string__isnull=True)
            .exclude(url_search_string="")
            .annotate(feed_count=Count("feed"))
            .filter(feed_count__gt=0)
        )

    def _find_potential_parents(self, child: Source) -> list[Source]:
        return list(
            Source.objects.filter(name=child.name, platform=child.platform)
            .filter(url_search_string__isnull=True)
            .exclude(id=child.id)
        )

    def _move_feeds(self, child: Source, parent: Source) -> int:
        return Feed.objects.filter(source=child).update(source=parent)
