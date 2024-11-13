from django import forms
from django.contrib import admin
from django.forms import widgets
from .models import ConfigProperty

class ConfigPropertyForm(forms.ModelForm):
    class Meta:
        model = ConfigProperty
        fields = ["property_name", "property_value", "property_type"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set widget based on property_type
        if self.instance.property_type == "boolean":
            self.fields["property_value"].widget = forms.CheckboxInput()
        elif self.instance.property_type == "integer":
            self.fields["property_value"].widget = forms.NumberInput()
        else:
            self.fields["property_value"].widget = forms.TextInput()

@admin.register(ConfigProperty)
class ConfigPropertyAdmin(admin.ModelAdmin):
    form = ConfigPropertyForm
    list_display = ("property_name", "property_value", "property_type")
    readonly_fields = ("property_name",)

    def has_add_permission(self, request):
        #disable addition of new configuration properties
        return False

    def has_delete_permission(self, request, obj=None):
        #disable deletion of any config properties
        return False