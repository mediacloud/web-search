from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.utils.html import format_html, format_html_join
from django.urls import reverse, path
from django.contrib.contenttypes.models import ContentType

from guardian.shortcuts import assign_perm, get_objects_for_user, remove_perm
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


def mark_inactive(modeladmin, request, queryset):
    updated = queryset.update(is_active=False)
    messages.success(request, f"{updated} user(s) marked as inactive.")

mark_inactive.short_description = "Mark selected users as inactive" 


class CustomUserAdmin(BaseUserAdmin):
    form = UserAdminForm
    ordering = ['-date_joined']
    actions = [mark_inactive]
    
    def current_collection_permissions(self, obj):
        """Display the collection IDs this user can edit, as a table with remove buttons."""
        if not obj.pk:
            return "Save user first to see permissions"
        collections = get_objects_for_user(obj, "edit_collection", Collection)
        if not collections:
            return "None"
        rows = []
        for c in collections:
            remove_url = reverse('admin:remove_collection_permission', args=[obj.pk, c.pk])
            rows.append((
                c.pk,
                c.name,
                format_html('<a class="button" href="{}">Remove</a>', remove_url)
            ))
        return format_html(
            '<table><tr><th>ID</th><th>Name</th><th>Action</th></tr>{}</table>',
            format_html_join('', '<tr><td>{}</td><td>{}</td><td>{}</td></tr>', rows)
        )
    
    readonly_fields = BaseUserAdmin.readonly_fields + ('current_collection_permissions',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Collection Permissions', {
            'fields': ('collection_id', "current_collection_permissions"),
        }),
    )
    current_collection_permissions.allow_tags = True
    current_collection_permissions.short_description = "Current Collection IDs with Edit Permissions"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'remove-collection-permission/<int:user_id>/<int:collection_id>/',
                self.admin_site.admin_view(self.remove_collection_permission),
                name='remove_collection_permission',
            ),
        ]
        return custom_urls + urls

    def remove_collection_permission(self, request, user_id, collection_id):
        user = User.objects.get(pk=user_id)
        collection = Collection.objects.get(pk=collection_id)
        remove_perm('edit_collection', user, collection)
        messages.success(request, f"Removed edit_collection permission for Collection {collection_id} from user {user.username}")
        # Redirect back to the user change page
        return HttpResponseRedirect(
            reverse('admin:auth_user_change', args=[user_id])
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
