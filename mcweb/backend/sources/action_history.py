"""
Action history tracking for Sources app.

Provides a mixin for viewsets to automatically track CRUD operations,
and a context manager to suppress logging during bulk operations.
"""
import logging
from contextvars import ContextVar

from .models import ActionHistory, log_action

logger = logging.getLogger(__name__)

# Context variable to store the active ActionHistoryContext instance
# When set, the mixin will accumulate actions instead of logging them
_delegated_history = ContextVar('delegated_history', default=None)


class ActionHistoryContext:
    """
    Context manager to suppress action history logging during bulk operations
    and accumulate the actions that would have been logged.
    
    Usage:
        with ActionHistoryContext() as ctx:
            # All action history logging is suppressed and accumulated
            # ... perform bulk operations ...
            pass
        # After context exits, access accumulated actions:
        actions = ctx.actions  # List of action dicts
        summary = ctx.get_summary()  # Get summary statistics
    """
    
    def __init__(self):
        """Initialize with empty action accumulator"""
        self.actions = []
    
    def __enter__(self):
        """Enter context - suppress action history logging and start accumulating"""
        _delegated_history.set(self)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context - restore normal action history logging"""
        _delegated_history.set(None)
        return False  # Don't suppress exceptions
    
    def add_action(self, action_data):
        """
        Add an action to the accumulator.
        Called by the mixin when logging is delegated.
        """
        self.actions.append(action_data)
    
    def get_summary(self):
        """
        Get summary statistics of accumulated actions.
        
        Returns dict with counts by action_type and object_model:
        {
            'total': 10,
            'by_action_type': {'create': 3, 'update': 7},
            'by_object_model': {'Source': 10},
            'object_ids': [1, 2, 3, ...]
        }
        """
        summary = {
            'total': len(self.actions),
            'by_action_type': {},
            'by_object_model': {},
            'object_ids': [],
        }
        
        for action in self.actions:
            # Count by action type
            action_type = action.get('action_type', 'unknown')
            summary['by_action_type'][action_type] = summary['by_action_type'].get(action_type, 0) + 1
            
            # Count by object model
            object_model = action.get('object_model', 'unknown')
            summary['by_object_model'][object_model] = summary['by_object_model'].get(object_model, 0) + 1
            
            # Collect object IDs
            object_id = action.get('object_id')
            if object_id:
                summary['object_ids'].append(object_id)
        
        return summary
    
    def log_summary(self, user, action_type, object_model, object_id, object_name, 
                    additional_changes=None, notes=None):
        """
        Create a summary ActionHistory record from accumulated actions.
        
        Args:
            user: Django User object
            action_type: Summary action type (e.g., "bulk_upload_sources")
            object_model: ModelType enum value for the primary object
            object_id: ID of the primary object
            object_name: Name of the primary object
            additional_changes: Optional dict of additional changes to include
            notes: Optional notes string (will be auto-generated if not provided)
        
        Returns:
            The created ActionHistory instance, or None if no actions were accumulated
        """
        if not self.actions:
            # No actions accumulated, nothing to log
            return None
        
        summary = self.get_summary()
        
        # Build changes dict
        changes = {
            'summary': summary['by_action_type'],
            'total_actions': summary['total'],
            'by_object_model': summary['by_object_model'],
            'object_ids': summary['object_ids'][:100],  # Limit to avoid huge JSON
        }
        
        # Merge in additional changes if provided
        if additional_changes:
            changes.update(additional_changes)
        
        # Auto-generate notes if not provided
        if notes is None:
            action_parts = []
            for act_type, count in summary['by_action_type'].items():
                action_parts.append(f"{count} {act_type}")
            notes = f"Bulk operation: {', '.join(action_parts)}"
        
        return log_action(
            user=user,
            action_type=action_type,
            object_model=object_model,
            object_id=object_id,
            object_name=object_name,
            changes=changes,
            notes=notes,
        )


class ActionHistoryMixin:
    """
    Mixin that automatically tracks CRUD operations for Django REST Framework viewsets.
    
    Usage:
        class CollectionViewSet(ActionHistoryMixin, viewsets.ModelViewSet):
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
        If in a delegated_history context, accumulates actions instead of logging.
        """
        if not self.action_history_object_model:
            return
        
        # Check if logging is delegated (accumulate during bulk operations)
        context = _delegated_history.get()
        if context:
            # Accumulate the action instead of logging it
            action_data = {
                'action_type': action_type,
                'object_model': self.action_history_object_model,
                'object_id': instance.id,
                'object_name': self._get_object_name(instance),
                'changes': changes,
                'notes': notes,
            }
            context.add_action(action_data)
            logger.debug(f"Accumulated action history (delegated): {action_type} on {self.action_history_object_model} {instance.id}")
            return
        
        # Normal logging
        try:
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

