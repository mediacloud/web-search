from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from guardian.shortcuts import assign_perm
from .forms import UserAdminForm

from .models import Profile

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
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Collection Permissions', {
            'fields': ('collection_id',),
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        collection = form.cleaned_data.get('collection_id')
        if collection:
            assign_perm('edit_collection', obj, collection)


# Re-register UserAdmin
admin.site.unregister(User)
# admin.site.register(User, UserAdmin)
admin.site.register(User, CustomUserAdmin)
