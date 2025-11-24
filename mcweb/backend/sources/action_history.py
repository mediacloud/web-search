"""
Action history tracking for Sources app.

Provides a mixin for viewsets to automatically track CRUD operations,
and a context manager to suppress logging during bulk operations.
"""
import logging
from contextvars import ContextVar

from .models import ActionHistory, log_action

logger = logging.getLogger(__name__)

# Context variable to suppress action history logging during bulk operations
# When set to True, the mixin will skip logging (delegated to bulk operation handler)
_delegated_history = ContextVar('delegated_history', default=False)


class ActionHistoryContext:
    """
    Context manager to suppress action history logging during bulk operations.
    
    Usage:
        with ActionHistoryContext():
            # All action history logging is suppressed
            # ... perform bulk operations ...
            pass
        # Logging resumes normally after context exits
    """
    
    def __enter__(self):
        """Enter context - suppress action history logging"""
        _delegated_history.set(True)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context - restore normal action history logging"""
        _delegated_history.set(False)
        return False  # Don't suppress exceptions


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
        Skips logging if we're in a delegated_history context (bulk operations).
        """
        if not self.action_history_object_model:
            return
        
        # Check if logging is delegated (suppressed during bulk operations)
        if _delegated_history.get():
            logger.debug(f"Skipping action history log (delegated): {action_type} on {self.action_history_object_model} {instance.id}")
            return
        
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

