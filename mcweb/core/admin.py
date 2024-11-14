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
        if self.instance.property_type == "bool":
            self.fields["property_value"].widget = forms.CheckboxInput()
        elif self.instance.property_type == "int":
            self.fields["property_value"].widget = forms.NumberInput()
        else:
            self.fields["property_value"].widget = forms.TextInput()

    def clean_property_value(self):
    	#the value is serialized as a string
        value = self.cleaned_data["property_value"]
        # Convert the input based on property_type before saving
        if self.instance.property_type == "bool":
            return str(bool(value))  # Store as "True" or "False"
        elif self.instance.property_type == "int":
            return str(int(value))   # Store as a string representing an integer
        return value  # Default to string as-is for other types


@admin.register(ConfigProperty)
class ConfigPropertyAdmin(admin.ModelAdmin):
    form = ConfigPropertyForm
    list_display = ("property_name", "property_value",)
    readonly_fields = ("property_name","property_type")

    def has_add_permission(self, request):
        #disable addition of new configuration properties
        return False

    def has_delete_permission(self, request, obj=None):
        #disable deletion of any config properties
        return False