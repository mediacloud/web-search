# Testing Action History Logging for Background Tasks

This document outlines ways to test background tasks and verify they create expected action history logs in a development environment.

## Overview

Background tasks that create action history logs:
1. **`_scrape_source()`** - Scrapes a single source, creates parent event with child events for feed discoveries
2. **`_scrape_collection()`** - Scrapes all sources in a collection, creates parent event with child events
3. **`update_source_language()`** - Bulk updates `Source.primary_language`, logs individual updates
4. **`update_publication_date()`** - Bulk updates `Source.first_story`, logs individual updates

## Method 1: Using Management Commands with `.now()` (Recommended for Dev)

The easiest way to test in development is using management commands that run tasks synchronously using `.now()`.

### Test Scrape Source

```bash
# Run synchronously (no --queue flag)
python mcweb/manage.py scrape-source <source_id> <user_email>

# Example:
python mcweb/manage.py scrape-source 1 admin@example.com
```

**What to verify:**
- Check Django Admin → Action History
- Should see a parent event with `action_type="rescrape-source"`
- Should see child events for any feeds discovered (if `Source._scrape_source()` calls `log_action()` for feeds)
- Parent event should have `child_count > 0` if feeds were discovered
- Parent event `notes` should contain summary from ScrapeContext

### Test Scrape Collection

```bash
# Run synchronously (no --queue flag)
python mcweb/manage.py scrape-collection <collection_id> <user_email>

# Example:
python mcweb/manage.py scrape-collection 1 admin@example.com
```

**What to verify:**
- Check Django Admin → Action History
- Should see a parent event with `action_type="rescrape-collection"`
- Should see child events for each source scraped (if sources create child events)
- Parent event should summarize the collection scrape

### Test Language Update

```bash
# Run synchronously (no --queue flag, default behavior)
python mcweb/manage.py sources-meta-update --task language --provider-name onlinenews-mediacloud --batch-size 10

# Or queue it (requires worker running):
python mcweb/manage.py sources-meta-update --task language --queue --batch-size 10
```

**What to verify:**
- Check Django Admin → Action History
- Should see individual events with `action_type="update-source-language"` for each source updated
- Each event should have `object_model="Source"` and the correct `object_id` and `object_name`
- Events should be linked to a parent event if wrapped in `ActionHistoryContext` (currently they're not - they're standalone)

### Test Publication Date Update

```bash
# Run synchronously (no --queue flag, default behavior)
python mcweb/manage.py sources-meta-update --task publication_date --provider-name onlinenews-mediacloud --batch-size 10

# Or queue it:
python mcweb/manage.py sources-meta-update --task publication_date --queue --batch-size 10
```

**What to verify:**
- Check Django Admin → Action History
- Should see individual events with `action_type="update-source-pub-date"` for each source updated
- Each event should have `object_model="Source"` and the correct `object_id` and `object_name`

## Method 2: Direct Python Shell Testing

You can also test directly in Django shell:

```python
# Start Django shell
python mcweb/manage.py shell

# Import tasks
from mcweb.backend.sources.tasks import _scrape_source, _scrape_collection
from mcweb.backend.sources.models import Source, Collection
from django.contrib.auth.models import User

# Get a test user
user = User.objects.first()
source = Source.objects.first()
collection = Collection.objects.first()

# Run scrape_source synchronously
_scrape_source.now(source.id, source.homepage, source.name, user.email)

# Run scrape_collection synchronously  
_scrape_collection.now(collection.id, user.email)

# Check action history
from mcweb.backend.sources.models import ActionHistory
ActionHistory.objects.filter(action_type__startswith='rescrape').order_by('-created_at')[:10]
```

## Method 3: Running Background Workers (Closer to Production)

If you want to test the actual background task queue:

1. **Start a worker process:**
   ```bash
   python mcweb/manage.py process_tasks --queue admin-fast
   # or
   python mcweb/manage.py process_tasks --queue admin-slow
   ```

2. **Queue tasks using management commands:**
   ```bash
   # Queue a scrape (won't run until worker picks it up)
   python mcweb/manage.py scrape-source --queue <source_id> <user_email>
   python mcweb/manage.py scrape-collection --queue <collection_id> <user_email>
   python mcweb/manage.py sources-meta-update --queue --task language
   ```

3. **Or queue directly in Python:**
   ```python
   from mcweb.backend.sources.tasks import _scrape_source
   from mcweb.backend.sources.models import Source
   from django.contrib.auth.models import User
   
   source = Source.objects.first()
   user = User.objects.first()
   
   # This queues the task (doesn't run immediately)
   _scrape_source(source.id, source.homepage, source.name, user.email)
   ```

## Method 4: Checking Action History in Django Admin

After running any task, verify the logs:

1. Navigate to Django Admin → Action History
2. Filter by:
   - `action_type` (e.g., "rescrape-source", "rescrape-collection", "update-source-language")
   - `object_model` (e.g., "Source", "Collection")
   - `created_at` (recent time range)
3. Check for:
   - **Parent events**: Should have `is_parent_event=True` and `child_count > 0`
   - **Child events**: Should have `parent_event` set to the parent event
   - **User information**: `user_name` and `user_email` should be populated
   - **Notes**: Should contain meaningful summaries
   - **Changes**: Should contain relevant metadata (e.g., `child_event_count` for parent events)

## Method 5: Database Queries for Verification

You can also verify programmatically:

```python
from mcweb.backend.sources.models import ActionHistory
from django.utils import timezone
from datetime import timedelta

# Get recent rescrape events
recent = timezone.now() - timedelta(minutes=5)
rescrapes = ActionHistory.objects.filter(
    action_type__startswith='rescrape',
    created_at__gte=recent
).order_by('-created_at')

# Check parent-child relationships
for event in rescrapes:
    if event.is_parent():
        print(f"Parent: {event.action_type} - {event.object_name}")
        print(f"  Child count: {event.child_events.count()}")
        for child in event.child_events.all():
            print(f"    Child: {child.action_type} - {child.object_name}")
    elif event.parent_event:
        print(f"Child: {event.action_type} - Parent: {event.parent_event.id}")
```

## Testing Checklist

For each task type, verify:

- [ ] **Parent event created** (for bulk operations)
- [ ] **Child events created and linked** (for operations that create multiple records)
- [ ] **User information populated** (`user`, `user_name`, `user_email`)
- [ ] **Object information correct** (`object_model`, `object_id`, `object_name`)
- [ ] **Notes contain meaningful summary**
- [ ] **Changes dict populated** (if applicable)
- [ ] **Timestamps correct** (`created_at`)
- [ ] **Parent event summary updated** (child count, final notes)

## Troubleshooting

### No action history records created

1. **Check if task actually ran:**
   - Look for log files in `RESCRAPE_LOG_DIR` (for scrape tasks)
   - Check Django logs for task execution
   - Verify task didn't error out early

2. **Check ActionHistoryContext:**
   - Verify `ScrapeContext.__enter__()` is creating `ActionHistoryContext`
   - Check that `__exit__()` is being called (even on exceptions)

3. **Check log_action calls:**
   - Verify `log_action()` is being called for individual operations
   - Check that `_delegated_history.get()` returns the context when expected

### Child events not linked to parent

1. **Verify context is active:**
   - Check that `ActionHistoryContext.__enter__()` was called
   - Verify `_delegated_history.get()` returns the context

2. **Check parent_event assignment:**
   - Verify `log_action()` is checking for active context
   - Check that `parent_event` FK is being set correctly

### User information missing

1. **Check user lookup:**
   - Verify `User.objects.filter(email=...)` finds the user
   - Check that user has `username` and `email` attributes

2. **Check denormalization:**
   - Verify `log_action()` is populating `user_name` and `user_email` fields

## Notes

- **`.now()` vs queued**: Using `.now()` runs synchronously and is easier to debug, but queued tasks are closer to production behavior
- **Batch size**: Use small `--batch-size` values (e.g., 10) for testing to avoid processing too many sources
- **Provider**: Make sure the provider name matches your environment (default: `onlinenews-mediacloud`)
- **Worker processes**: If testing with queued tasks, you need worker processes running (`process_tasks` command)


