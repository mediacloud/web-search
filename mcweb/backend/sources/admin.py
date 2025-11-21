from django.contrib import admin

from .models import Collection, ActionHistory
from guardian.admin import GuardedModelAdmin



class CollectionAdmin(GuardedModelAdmin):
    list_display = ('id', 'name', 'public', 'notes', 'modified_at')
    search_fields = ('id', 'name')
    list_filter = ('public',)
    ordering = ('-modified_at',)


admin.site.register(Collection, CollectionAdmin)

@admin.register(ActionHistory)
class ActionHistoryAdmin(admin.ModelAdmin):
    """
    Admin interface for viewing action history records.
    Read-only to prevent manual tampering with audit trail.
    """
    list_display = [
        'created_at',
        'user',
        'action_type',
        'model_type',
        'object_id',
        'object_name',
        'notes',
    ]
    
    list_filter = [
        'action_type',
        'model_type',
        'created_at',
        # Removed 'user' - too many users to filter effectively
    ]
    
    search_fields = [
        'object_name',
        'object_id',
        'user__user__username',  # Profile -> User -> username
        'user__user__email',      # Profile -> User -> email
        'notes',
    ]
    
    readonly_fields = [
        'user',
        'action_type',
        'model_type',
        'object_id',
        'object_name',
        'created_at',
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
            'fields': ('created_at', 'user', 'action_type', 'model_type')
        }),
        ('Object Information', {
            'fields': ('object_id', 'object_name')
        }),
        ('Additional Information', {
            'fields': ('changes', 'notes'),
            'classes': ('collapse',)  # Collapsible section
        }),
    )

