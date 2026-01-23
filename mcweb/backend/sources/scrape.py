import logging
import types                    # TracebackType

from django.contrib.auth.models import User

# local directory mcweb/backend/sources
from .action_history import ActionHistoryContext, _delegated_history, log_action
from .models import Source, Collection, ActionHistory

# mcweb/backend/util
from ..util.tasks import TaskLogContext

# mcweb/
from util.send_emails import send_rescrape_email
from settings import (
    ADMIN_EMAIL,
    EMAIL_ORGANIZATION,
    EMAIL_NOREPLY,
    SCRAPE_ERROR_RECIPIENTS,
)

logger = logging.getLogger(__name__)

SCRAPE_FROM_EMAIL = EMAIL_NOREPLY

class ScrapeContext(TaskLogContext):
    """
    context for rescrape tasks:

    sends email (split out and support MIME so can be used for alert system?)
    """
    # control logging with a constance setting?
    LOG_FILE = True

    def __init__(self, *, options: dict, task_args: dict,
                 subject: str, email: str, what: str, id: int):
        self.subject = subject
        self.email = email
        self.recipients = [email]
        self.what = what        # "source" or "collection"
        self.id = id

        self.errors = False

        # init TaskLogContext:
        super().__init__(options=options, task_args=task_args)

    def __enter__(self) -> "ScrapeContext":
        super().__enter__()

        self.body_chunks: list[str] = []

        # Create and activate ActionHistoryContext for logging feed discoveries
        # Look up User by name (or None if not found)
        try:
            user = User.objects.get(username=self.username)
        except Exception:
            user = None

        # Determine object_model from what
        if self.what == "source":
            object_model = ActionHistory.ModelType.SOURCE
            # Fetch object to get name
            try:
                obj = Source.objects.get(id=self.id)
                object_name = obj.name or f"Source {self.id}"
            except Source.DoesNotExist:
                object_name = f"Source {self.id}"
        else:  # collection
            object_model = ActionHistory.ModelType.COLLECTION
            # Fetch object to get name
            try:
                obj = Collection.objects.get(id=self.id)
                object_name = obj.name or f"Collection {self.id}"
            except Collection.DoesNotExist:
                object_name = f"Collection {self.id}"

        # Create ActionHistoryContext
        self.action_history_ctx = ActionHistoryContext(
            user=user,
            action_type=f"rescrape-{self.what}",
            object_model=object_model,
            object_id=self.id,
            object_name=object_name,
            additional_changes={},
            notes=None  # Will be set in __exit__()
        )
        
        # Activate the context
        self.action_history_ctx.__enter__()

        return self

    def add_body_chunk(self, chunk: str) -> None:
        logger.debug("body_chunk: %s", chunk)
        if not chunk.endswith("\n"):
            chunk += "\n"
            # XXX complain?
        self.body_chunks.append(chunk)

    def body(self):
        # separate source chunks with blank lines (each already has trailing newline)
        return "\n".join(self.body_chunks)

    def add_error(self, exception: bool = True):
        """
        add ADMIN_EMAIL & users in SCRAPE_ERROR_RECIPIENTS to recipients
        """
        if exception:
            self.add_body_chunk(f"ERROR:\n{traceback.format_exc()}") # format_exc has final newline
        if self.errors:
            return
        self.errors = True
        if ADMIN_EMAIL and ADMIN_EMAIL not in self.recipients:
            self.recipients.append(ADMIN_EMAIL)
        for u in SCRAPE_ERROR_RECIPIENTS:
            if u not in self.recipients:
                self.recipients.append(u)

    def __exit__(self, type_: type[BaseException],
                 value: BaseException,
                 traceback_: types.TracebackType) -> bool:

        if type_ or self.errors:
            self.subject += " (WITH ERRORS)"

        # logs before and after:
        send_rescrape_email(f"[{EMAIL_ORGANIZATION}] {self.subject}",
                            self.body(), SCRAPE_FROM_EMAIL, self.recipients)

        # Update ActionHistoryContext with final summary and clean up
        if self.action_history_ctx:
            # Update notes with final summary
            summary_line = self.body_chunks[-1] if self.body_chunks else 'no details'
            self.action_history_ctx.notes = f"Rescrape completed: {summary_line}, initiated by {self.email}"
            
            # Update additional_changes if needed (e.g., feed counts could be extracted from body_chunks)
            # For now, just pass through - could be enhanced later
            
            # Call __exit__() to update parent with summary and clean up
            try:
                self.action_history_ctx.__exit__(None, None, None)
            except Exception as e:
                logger.error(f"Error cleaning up ActionHistoryContext: {e}", exc_info=True)

        super().__exit__(type_, value, traceback_) # TaskLogContext

        return True             # suppress exception!!!!

# NOTE! If arguments added, need to adjust both
# tasks.schedule_scrape_source AND management/commands/scrape-source.py
def scrape_source(*, source_id: int, homepage: str, name: str, email: str,
                  options: dict, task_args: dict) -> None:
    """
    invoked only from task.scrape_collection (decorated)
    """
    logger.info("== starting _scrape_source %d (%s) %s for %s",
                source_id, name, homepage, email)

    subject = f"Source {source_id} ({name}) scrape complete"

    # ScrapeContext handles exceptions, sends mail!
    with ScrapeContext(options=options, task_args=task_args,
                       subject=subject, email=email,
                       what="source", id=source_id) as sc:
        sc.add_body_chunk(Source._scrape_source(source_id, homepage, name))

    logger.info(f"== finished _scrape_source {source_id} ({name}) {homepage} for {email}")
   

# NOTE! If arguments added, need to adjust both
# tasks.shedule_scrape_collection AND management/commands/scrape-collection.py
def scrape_collection(*, options: dict, task_args: dict,
                     collection_id: int, email: str) -> None:
    """
    invoked only from task.scrape_collection (decorated)
    """
    logger.info(f"==== starting _scrape_collection(%d) for %s",
                collection_id, email)

    errors = 0
    subject = f"Collection {collection_id} scrape complete"
    with ScrapeContext(options=options, task_args=task_args,
                       subject=subject, email=email,
                       what="collection", id=collection_id) as sc:
        collection = Collection.objects.get(id=collection_id)
        if not collection:
            # now checked in schedule_scrape_collection, so should not happen!
            logger.info("collection id %d not found", collection_id)
            sc.add_error(False)
            sc.add_body_chunk(f"collection {collection_id} not found")
            return

        sources = collection.source_set.all()
        for source in sources:
            logger.info(f"== starting Source._scrape_source %d (%s) in collection %d for %s",
                        source.id, source.name, collection_id, email)
            if source.url_search_string:
                sc.add_body_chunk(f"Skippped source {source.id} ({source.name}) with URL search string {source.url_search_string}\n")
                logger.warning(f"  Source %d (%s) has url_search_string %s",
                               source.id, source.name, source.url_search_string)
                continue

            try:
                # remove verbosity=0 for more output!
                sc.add_body_chunk(
                    Source._scrape_source(source.id, source.homepage, source.name, verbosity=0))
            except Exception as e:
                logger.exception("Source._scrape_source exception in _scrape_source %d for %s",
                                 source.id, email)
                sc.add_error()  # keep going

                # for debug (seeing where hung by ^C-ing under
                # dokku-scripts/outside/run-manage-pdb.sh)
                if isinstance(e, KeyboardInterrupt):
                    raise
            logger.info(f"== finished Source._scrape_source %d (%s) in collection %d %s for %s",
                        source.id, source.name, collection_id, collection.name, email)

        logger.info(f"==== finished _scrape_collection(%d, %s) for %s",
                    collection.id, collection.name, email)
    # end with ScrapeContext...
