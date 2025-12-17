from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import Profile


# Define an inline admin descriptor for Employee model
# which acts a bit like a singleton
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'profile'
    ordering = ['-created_at']


# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = [ProfileInline]
    search_fields = ('email', 'username', 'first_name', 'last_name')


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
