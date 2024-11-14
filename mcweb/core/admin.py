from django import forms
from django.contrib import admin
from django.forms import widgets
from .models import ConfigProperty

class ConfigPropertyForm(forms.ModelForm):
    # Define a field for displaying property name alongside property value
    property_display = forms.Field(label="", required=False)

    class Meta:
        model = ConfigProperty
        fields = ["property_display", "property_type"]  # Hide raw property_name, property_value

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Dynamically set the widget and label for property_display based on the instance
        self.fields["property_display"].label = self.instance.property_name
        self.fields["property_display"].widget = self.get_widget_for_property_type()

    def get_widget_for_property_type(self):
        """Returns the appropriate widget based on property_type."""
        if self.instance.property_type == "boolean":
            return forms.CheckboxInput()
        elif self.instance.property_type == "integer":
            return forms.NumberInput()
        elif self.instance.property_type == "date":
            return forms.DateInput(attrs={"type": "date"})
        return forms.TextInput()

    def clean_property_display(self):
        # Transform the cleaned display field input to be saved in property_value
        value = self.cleaned_data["property_display"]
        if self.instance.property_type == "boolean":
            return str(bool(value))  # Store as "True" or "False"
        elif self.instance.property_type == "integer":
            return str(int(value))   # Store as a string representing an integer
        elif self.instance.property_type == "date":
            return value.strftime("%Y-%m-%d")  # Convert date to "YYYY-MM-DD"
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