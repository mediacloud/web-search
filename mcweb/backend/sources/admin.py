from django.contrib import admin
from .models import ActionHistory


class IsParentEventFilter(admin.SimpleListFilter):
    """Filter to show only parent events or only child events"""
    title = 'event type'
    parameter_name = 'event_type'

    def lookups(self, request, model_admin):
        return (
            ('parent', 'Parent events only'),
            ('child', 'Child events only'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'parent':
            return queryset.filter(parent_event__isnull=True)
        if self.value() == 'child':
            return queryset.filter(parent_event__isnull=False)
        return queryset


@admin.register(ActionHistory)
class ActionHistoryAdmin(admin.ModelAdmin):
    """
    Admin interface for viewing action history records.
    Read-only to prevent manual tampering with audit trail.
    """
    list_display = [
        'created_at',
        'user_name',
        'action_type',
        'object_model',
        'object_id',
        'object_name',
        'is_parent_event',
        'child_count',
        'notes',
    ]
    
    list_filter = [
        'action_type',
        'object_model',
        'created_at',
        IsParentEventFilter,  # Filter by parent vs child events
        # Removed 'user' - too many users to filter effectively
    ]
    
    def is_parent_event(self, obj):
        """Display if this is a parent event"""
        return obj.is_parent()
    is_parent_event.boolean = True
    is_parent_event.short_description = 'Is Parent'
    
    def child_count(self, obj):
        """Display number of child events"""
        if obj.is_parent():
            return obj.child_events.count()
        return '-'
    child_count.short_description = 'Children'
    
    search_fields = [
        'object_name',
        'object_id',
        'user_name',      # Direct search on denormalized username
        'user_email',     # Direct search on denormalized email
        'user__username', # Also search via FK relationship
        'user__email',    # Also search via FK relationship
        'notes',
    ]
    
    readonly_fields = [
        'user',
        'user_name',
        'user_email',
        'action_type',
        'object_model',
        'object_id',
        'object_name',
        'created_at',
        'parent_event',
        'changes',
        'notes',
    ]
    
    ordering = ['-created_at']  # Newest first
    
    date_hierarchy = 'created_at'  # Adds date drill-down navigation
    
    # Make it read-only
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False  # Or True if you want to allow deletion
    
    # Optional: Customize the detail view
    fieldsets = (
        ('Action Details', {
            'fields': ('created_at', 'user', 'user_name', 'user_email', 'action_type', 'object_model')
        }),
        ('Relationships', {
            'fields': ('parent_event',),
            'description': 'Parent event for bulk operations. Child events are linked here.'
        }),
        ('Object Information', {
            'fields': ('object_id', 'object_name')
        }),
        ('Additional Information', {
            'fields': ('changes', 'notes'),
            'classes': ('collapse',)  # Collapsible section
        }),
    )