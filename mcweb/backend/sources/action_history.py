"""
Action history tracking for Sources app.

Provides a mixin for viewsets to automatically track CRUD operations,
and a context manager to create parent-child relationships for bulk operations.
"""
import logging
from contextvars import ContextVar
from django.contrib.auth.models import User

from .models import ActionHistory

logger = logging.getLogger(__name__)

# Context variable to store the active ActionHistoryContext instance
# When set, log_action will set parent_event on created records
_delegated_history = ContextVar('delegated_history', default=None)


def log_action(user, action_type, object_model, object_id=None, object_name=None, 
               changes=None, notes=None, parent_event=None):
    """
    Helper function to create an ActionHistory record.
    Returns the created ActionHistory instance.
    
    Args:
        user: Django User object (from django.contrib.auth.models.User)
        action_type: str (name of action, for searching)
        object_model: the model the action is associated with
        object_id: the id of the model being acted on
        object_name: the name of the model being acted on
        changes: a simple json diff of changes made
        notes: optional additional context
        parent_event: Optional ActionHistory instance to set as parent (usually None, set by context)
    """
    logger.debug("logging action")
    
    # Check for active context - if present and parent exists, use it
    # Note: parent_event may not exist yet (created in log_summary), so we track IDs
    # and update them later
    context = _delegated_history.get()
    if context and context.parent_event:
        parent_event = context.parent_event
    
    # Extract user info if authenticated
    user_obj = None
    username = None
    email = None
    
    if user and hasattr(user, 'is_authenticated') and user.is_authenticated:
        user_obj = user
        username = getattr(user, 'username', None)
        email = getattr(user, 'email', None)
    
    action_record = ActionHistory.objects.create(
        user=user_obj,
        user_name=username,
        user_email=email,
        action_type=action_type,
        object_model=object_model,
        object_id=object_id,
        object_name=object_name,
        parent_event=parent_event,  # Will be None initially, updated later if in context
        changes=changes,
        notes=notes
    )
    
    # Track child event ID if we're in a context and this is actually a child event
    # (i.e., parent_event is None and will be set later, or we're creating a child)
    if context:
        # Track all events created during context as potential children
        # (parent_event will be None until log_summary() is called)
        if parent_event is None:
            context.child_event_ids.append(action_record.id)
            logger.debug(f"Tracked child event {action_record.id} for parent linking (context active, {len(context.child_event_ids)} total)")
        else:
            logger.debug(f"Event {action_record.id} already has parent {parent_event.id}, not tracking")
    
    return action_record


class ActionHistoryContext:
    """
    Context manager to create parent-child relationships for bulk operations.
    All actions logged while this context is active will be marked as children
    of a parent event created by log_summary().
    
    Usage:
        with ActionHistoryContext() as ctx:
            # Actions logged here will be children of the parent event
            # ... perform bulk operations ...
            pass
        # Create parent event and link all child events
        ctx.log_summary(user, action_type, object_model, object_id, object_name)
    """
    
    def __init__(self):
        """Initialize context - parent event created lazily"""
        self.parent_event = None
        self.child_event_ids = []  # Track IDs of child events created during context
    
    def __enter__(self):
        """Enter context - activate for parent_event linking"""
        _delegated_history.set(self)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context - restore normal logging"""
        _delegated_history.set(None)
        return False  # Don't suppress exceptions
    
    def log_summary(self, user, action_type, object_model, object_id, object_name, 
                    additional_changes=None, notes=None):
        """
        Create a parent ActionHistory record and link all child events created during context.
        
        Args:
            user: Django User object
            action_type: Summary action type (e.g., "bulk_upload_sources")
            object_model: ModelType enum value for the primary object
            object_id: ID of the primary object
            object_name: Name of the primary object
            additional_changes: Optional dict of additional changes to include
            notes: Optional notes string (will be auto-generated if not provided)
        
        Returns:
            The created parent ActionHistory instance
        """
        # Build changes dict
        changes = additional_changes or {}
        changes['child_event_count'] = len(self.child_event_ids)
        
        # Auto-generate notes if not provided
        if notes is None:
            notes = f"Bulk operation with {len(self.child_event_ids)} child actions"
        
        # Create parent event (may be tracked as child initially, we'll remove it)
        self.parent_event = log_action(
            user=user,
            action_type=action_type,
            object_model=object_model,
            object_id=object_id,
            object_name=object_name,
            changes=changes,
            notes=notes,
            parent_event=None,  # Parent events have no parent
        )
        
        # Remove parent event ID from child_event_ids if it was added (it shouldn't be a child of itself)
        if self.parent_event.id in self.child_event_ids:
            self.child_event_ids.remove(self.parent_event.id)
            logger.debug(f"Removed parent event {self.parent_event.id} from child tracking")
        
        # Update all child events to link to this parent
        if self.child_event_ids:
            ActionHistory.objects.filter(id__in=self.child_event_ids).update(
                parent_event=self.parent_event
            )
            logger.debug(f"Linked {len(self.child_event_ids)} child events to parent {self.parent_event.id}")
        
        return self.parent_event


class ActionHistoryViewSetMixin:
    """
    Mixin that automatically tracks CRUD operations for Django REST Framework viewsets.
    
    Usage:
        class CollectionViewSet(ActionHistoryViewSetMixin, viewsets.ModelViewSet):
            action_history_object_model = ActionHistory.ModelType.COLLECTION
            # ... rest of viewset code ...
    """
    
    action_history_object_model = None  # Must be set by subclass
    
    def perform_create(self, serializer):
        """Override to log creation"""
        logger.debug(f"Mixin for {self.action_history_object_model} CREATE")
        instance = serializer.save()
        self._log_action("create", instance)
        return instance
    
    def perform_update(self, serializer):
        """Override to log updates"""
        logger.debug(f"Mixin for {self.action_history_object_model} UPDATE")
        changed_fields = self._get_changed_fields(serializer)
        updated_instance = serializer.save()
        self._log_action("update", updated_instance, changed_fields)
        return updated_instance
    
    def perform_destroy(self, instance):
        """Override to log deletion"""
        logger.debug(f"Mixin for {self.action_history_object_model} DESTROY")
        self._log_action("delete", instance)
        instance.delete()
    
    def _get_object_name(self, instance):
        """
        Extract a human-readable name from the instance.
        Tries common field names like 'name', 'label', 'title', etc.
        """
        for attr in ['name', 'label', 'title', 'homepage']:
            if hasattr(instance, attr):
                value = getattr(instance, attr)
                if value:
                    return str(value)
        # Fallback to ID if no name field found
        return f"ID {instance.id}"
    
    def _get_changed_fields(self, serializer):
        """
        Extract changed fields from serializer by comparing validated_data
        with current instance values.
        
        Returns dict of {field_name: "old_value -> new_value"}
        """
        changed_fields = {}
        instance = serializer.instance
        
        for field, new_value in serializer.validated_data.items():
            old_value = getattr(instance, field, None)
            
            # Handle different value types
            if old_value != new_value:
                # Format the change nicely
                old_str = str(old_value) if old_value is not None else "None"
                new_str = str(new_value) if new_value is not None else "None"
                changed_fields[field] = f"{old_str} -> {new_str}"
        
        return changed_fields
    
    def _log_action(self, action_type, instance, changes=None, notes=None):
        """
        Helper method to create ActionHistory records.
        Only logs if action_history_object_model is set.
        If in an ActionHistoryContext, the created event will be linked as a child.
        """
        if not self.action_history_object_model:
            return
        
        # Always log - context will set parent_event if active
        try:
            # log_action will automatically track child event IDs if context is active
            log_action(
                user=self.request.user if self.request.user.is_authenticated else None,
                action_type=action_type,
                object_model=self.action_history_object_model,
                object_id=instance.id,
                object_name=self._get_object_name(instance),
                changes=changes,
                notes=notes,
            )
        except Exception as e:
            logger.error(f"Failed to log action history: {e}", exc_info=True)

