from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.utils.html import format_html, format_html_join
from django.urls import reverse, path
from django.contrib.contenttypes.models import ContentType
from django.conf import settings
from django.db.models import (
    OuterRef,
    Subquery,
    IntegerField,
    FloatField,
    BooleanField,
    Value,
    F,
    Case,
    When,
    Exists,
    ExpressionWrapper,
)
from django.db.models.functions import Coalesce

from guardian.shortcuts import assign_perm, get_objects_for_user, remove_perm
from .forms import UserAdminForm

from mc_providers import provider_name, PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD
from .models import Profile, QuotaHistory
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


class IncreasedQuotaFilter(admin.SimpleListFilter):
    title = "Increased quota"
    parameter_name = "increased_quota"

    def lookups(self, request, model_admin):
        return (
            ("yes", "Yes"),
            ("no", "No"),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == "yes":
            return queryset.filter(quota_limit__gt=4000)
        if value == "no":
            return queryset.filter(quota_limit__lte=4000)
        return queryset


class HighRateLimitFilter(admin.SimpleListFilter):
    title = "High rate limit"
    parameter_name = "high_rate_limit"

    def lookups(self, request, model_admin):
        return (
            ("yes", "Yes"),
            ("no", "No"),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == "yes":
            return queryset.filter(high_rate_limit=True)
        if value == "no":
            return queryset.filter(high_rate_limit=False)
        return queryset


class QuotaStatusFilter(admin.SimpleListFilter):
    title = "Quota status"
    parameter_name = "quota_status"

    def lookups(self, request, model_admin):
        return (
            ("critical", "Running out (>=90%)"),
            ("high", "High usage (>=75%)"),
            ("normal", "Normal usage (<75%)"),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value == "critical":
            return queryset.filter(quota_used_pct__gte=90)
        if value == "high":
            return queryset.filter(quota_used_pct__gte=75)
        if value == "normal":
            return queryset.filter(quota_used_pct__lt=75)
        return queryset


class CustomUserAdmin(BaseUserAdmin):
    form = UserAdminForm
    ordering = ['-date_joined']
    inlines = [ProfileInline]

    actions = [mark_inactive]
    list_display = BaseUserAdmin.list_display + (
        "quota_limit",
        "weekly_hits",
        "quota_used_pct",
        "remaining_quota",
        "high_rate_limit",
    )
    list_filter = BaseUserAdmin.list_filter + (
        IncreasedQuotaFilter,
        HighRateLimitFilter,
        QuotaStatusFilter,
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        provider = provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD)
        week = QuotaHistory._this_week()
        current_week_hits = QuotaHistory.objects.filter(
            user_id=OuterRef("pk"),
            provider=provider,
            week=week,
        ).values("hits")[:1]
        high_rate_limit_group = User.groups.through.objects.filter(
            user_id=OuterRef("pk"),
            group__name=settings.GROUPS.HIGH_RATE_LIMIT,
        )

        queryset = queryset.annotate(
            quota_limit=F("profile__quota_mediacloud"),
            weekly_hits=Coalesce(
                Subquery(current_week_hits, output_field=IntegerField()),
                Value(0),
            ),
            high_rate_limit=Case(
                When(is_staff=True, then=Value(True)),
                When(Exists(high_rate_limit_group), then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            ),
        )

        return queryset.annotate(
            quota_used_pct=Case(
                When(
                    quota_limit__gt=0,
                    then=ExpressionWrapper(
                        100.0 * F("weekly_hits") / F("quota_limit"),
                        output_field=FloatField(),
                    ),
                ),
                default=Value(0.0),
                output_field=FloatField(),
            ),
            remaining_quota=ExpressionWrapper(
                F("quota_limit") - F("weekly_hits"),
                output_field=IntegerField(),
            ),
        )

    @admin.display(ordering="quota_limit", description="Quota limit")
    def quota_limit(self, obj):
        return obj.quota_limit

    @admin.display(ordering="weekly_hits", description="This week hits")
    def weekly_hits(self, obj):
        return obj.weekly_hits

    @admin.display(ordering="quota_used_pct", description="Quota used %")
    def quota_used_pct(self, obj):
        return f"{obj.quota_used_pct:.1f}%"

    @admin.display(ordering="remaining_quota", description="Remaining quota")
    def remaining_quota(self, obj):
        return obj.remaining_quota

    @admin.display(ordering="high_rate_limit", boolean=True, description="High rate")
    def high_rate_limit(self, obj):
        return obj.high_rate_limit

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
