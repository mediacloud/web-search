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
    
    # Check for active context - if present, use its parent_event
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
    
    # Ensure notes is never None (field doesn't allow null, only blank)
    if notes is None:
        notes = ""
    
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
    
    # Track child event ID if we're in a context and this is a child event
    # (parent_event will be set if context is active)
    if context:
        if parent_event is None:
            # This shouldn't happen if context is properly set up, but track it anyway
            logger.warning(f"Context active but parent_event is None for event {action_record.id}")
        else:
            # Event is already linked to parent via parent_event FK, just track ID for summary
            context.child_event_ids.append(action_record.id)
            logger.debug(f"Tracked child event {action_record.id} linked to parent {parent_event.id} (context active, {len(context.child_event_ids)} total)")
    
    return action_record


class ActionHistoryContext:
    """
    Context manager to create parent-child relationships for bulk operations.
    All actions logged while this context is active will be automatically marked
    as children of a parent event created in __enter__().
    
    Usage:
        with ActionHistoryContext(
            user=request.user,
            action_type="bulk_upload_sources",
            object_model=ActionHistory.ModelType.COLLECTION,
            object_id=collection.id,
            object_name=collection.name,
            additional_changes={"sources_skipped": 5},
            notes="Bulk upload operation"
        ) as ctx:
            # Actions logged here will be children of the parent event
            # ... perform bulk operations ...
            pass
        # __exit__() automatically updates parent with summary info
    """
    
    def __init__(self, user, action_type, object_model, object_id, object_name,
                 additional_changes=None, notes=None):
        """
        Initialize context with parent event information.
        
        Args:
            user: Django User object
            action_type: Summary action type (e.g., "bulk_upload_sources")
            object_model: ModelType enum value for the primary object
            object_id: ID of the primary object
            object_name: Name of the primary object
            additional_changes: Optional dict of additional changes to include in summary
            notes: Optional notes string (will be auto-generated if not provided)
        """
        self.user = user
        self.action_type = action_type
        self.object_model = object_model
        self.object_id = object_id
        self.object_name = object_name
        self.additional_changes = additional_changes or {}
        self.notes = notes
        
        self.parent_event = None
        self.child_event_ids = []  # Track IDs of child events created during context
    
    def __enter__(self):
        """Enter context - create parent event and activate for child linking"""
        # Create parent event immediately with basic info
        # Summary info will be added in __exit__()
        # Ensure notes is never None (field doesn't allow null)
        initial_notes = self.notes if self.notes is not None else "Bulk operation in progress"
        
        self.parent_event = log_action(
            user=self.user,
            action_type=self.action_type,
            object_model=self.object_model,
            object_id=self.object_id,
            object_name=self.object_name,
            changes={},  # Will be updated in __exit__()
            notes=initial_notes,  # Will be updated in __exit__()
            parent_event=None,  # Parent events have no parent
        )
        
        # Remove parent event ID from child_event_ids if it was added (it shouldn't be a child of itself)
        if self.parent_event.id in self.child_event_ids:
            self.child_event_ids.remove(self.parent_event.id)
            logger.debug(f"Removed parent event {self.parent_event.id} from child tracking")
        
        # Activate context for child event linking
        _delegated_history.set(self)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context - update parent with summary info and restore normal logging"""
        # Build summary changes dict
        changes = self.additional_changes.copy()
        changes['child_event_count'] = len(self.child_event_ids)
        
        # Build summary by action type and object model
        summary = {
            'by_action_type': {},
            'by_object_model': {},
            'object_ids': [],
        }
        
        # Get child events to analyze
        if self.child_event_ids:
            child_events = ActionHistory.objects.filter(id__in=self.child_event_ids)
            for child in child_events:
                action_type = child.action_type
                summary['by_action_type'][action_type] = summary['by_action_type'].get(action_type, 0) + 1
                
                object_model = child.object_model
                summary['by_object_model'][object_model] = summary['by_object_model'].get(object_model, 0) + 1
                
                if child.object_id:
                    summary['object_ids'].append(child.object_id)
        
        changes['summary'] = summary['by_action_type']
        changes['by_object_model'] = summary['by_object_model']
        changes['object_ids'] = summary['object_ids'][:100]  # Limit to avoid huge JSON
        
        # Auto-generate notes if not provided
        if self.notes is None:
            action_parts = []
            for act_type, count in summary['by_action_type'].items():
                action_parts.append(f"{count} {act_type}")
            notes = f"Bulk operation: {', '.join(action_parts)}"
        else:
            notes = self.notes
        
        # Update parent event with summary info
        self.parent_event.changes = changes
        self.parent_event.notes = notes
        self.parent_event.save(update_fields=['changes', 'notes'])
        
        logger.debug(f"Updated parent event {self.parent_event.id} with summary: {len(self.child_event_ids)} child events")
        
        # Restore normal logging
        _delegated_history.set(None)
        return False  # Don't suppress exceptions


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
            raise e
            #logger.error(f"Failed to log action history: {e}", exc_info=True)

