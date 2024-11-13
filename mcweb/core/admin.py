from django.contrib import admin
from .models import ConfigProperty


@admin.register(ConfigProperty)
class ConfigPropertyAdmin(admin.ModelAdmin):
	pass