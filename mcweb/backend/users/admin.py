from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User, Permission
from django.contrib.auth import get_user_model

from django.contrib.contenttypes.models import ContentType

from guardian.shortcuts import assign_perm, get_objects_for_user
from .forms import UserAdminForm

from .models import Profile
from ..sources.models import Collection

import logging

logger = logging.getLogger(__name__)

User = get_user_model()
# Define an inline admin descriptor for Employee model
# which acts a bit like a singleton
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'profile'


# # Define a new User admin
# class UserAdmin(BaseUserAdmin):
#     inlines = [ProfileInline]
#     search_fields = ('email', 'username', 'first_name', 'last_name')


class CustomUserAdmin(BaseUserAdmin):
    form = UserAdminForm
    
    def current_collection_permissions(self, obj):
        """Display the collection IDs this user can edit"""
        if obj.pk:
            collections = get_objects_for_user(obj, "edit_collection", Collection)
            if collections:
                collection_ids = [str(c.id) for c in collections]
                return ", ".join(collection_ids)
            return "None"
        return "Save user first to see permissions"
        
    current_collection_permissions.short_description = "Current Collection IDs with Edit Permissions"

    readonly_fields = BaseUserAdmin.readonly_fields + ('current_collection_permissions',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Collection Permissions', {
            'fields': ('collection_id', "current_collection_permissions"),
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        collection_id  = form.cleaned_data.get('collection_id')
        if collection_id:
            collection = Collection.objects.get(pk=collection_id)

            assign_perm("edit_collection", obj, collection)
            logger.info(f"Admin {request.user.username} granted edit permission for Collection {collection_id} to user {obj.username}")




# Re-register UserAdmin
admin.site.unregister(User)
# admin.site.register(User, UserAdmin)
admin.site.register(User, CustomUserAdmin)
