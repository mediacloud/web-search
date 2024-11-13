from django.contrib import admin
from .models import ConfigProperty


@admin.register(ConfigProperty)
class ConfigPropertyAdmin(admin.ModelAdmin):
	list_display = ("property_name", "property_value")
    readonly_fields = ("property_name",)  # Make property name read-only

    def has_add_permission(self, request):
        # Disallow adding new properties via admin
        return False