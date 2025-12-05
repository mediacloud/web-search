from django.contrib import admin
from .models import Collection 
from guardian.admin import GuardedModelAdmin

class CollectionAdmin(GuardedModelAdmin):
    list_display = ('id', 'name', 'public', 'notes', 'modified_at')
    search_fields = ('id', 'name')
    list_filter = ('public',)
    ordering = ('-modified_at',)


admin.site.register(Collection, CollectionAdmin)