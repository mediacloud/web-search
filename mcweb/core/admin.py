from django import forms
from django.contrib import admin
from django.forms import widgets
from .models import ConfigProperty

class ConfigPropertyForm(forms.ModelForm):
    # Define a field for displaying property name alongside property value
    property_display = forms.Field(label="", required=False)


    class Meta:
        model = ConfigProperty
        fields = ["property_display", "property_type"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Dynamically set the widget and label for property_display based on the instance
        self.fields["property_display"].label = self.instance.property_name
        self.fields["property_display"].widget = self.get_widget_for_property_type()

        # Convert the stored string value to the correct type for display
        if self.instance.property_type == "bool":
            self.initial["property_display"] = self.instance.property_value == "True"
        elif self.instance.property_type == "int":
            self.initial["property_display"] = int(self.instance.property_value)

    def get_widget_for_property_type(self):
        """Returns the appropriate widget based on property_type."""
        if self.instance.property_type == "bool":
            return forms.CheckboxInput()
        elif self.instance.property_type == "int":
            return forms.NumberInput()

        return forms.TextInput()

    def clean_property_display(self):
        # Transform the cleaned display field input to be saved in property_value
        value = self.cleaned_data["property_display"]
        if self.instance.property_type == "bool":
            return str(bool(value))  # Store as "True" or "False"
        elif self.instance.property_type == "int":
            return str(int(value))   # Store as a string representing an integer

        return value

    def save(self, commit=True):
        # Save the cleaned display field to property_value
        self.instance.property_value = self.cleaned_data["property_display"]
        return super().save(commit=commit)


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