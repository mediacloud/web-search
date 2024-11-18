from .models import ConfigProperty

def get_config_value(section, property_name):
    try:
        return ConfigProperty.objects.get(
            section=section,
            property_name=property_name).get_typed_value()
    except ConfigProperty.DoesNotExist:
        raise ValueError(f"Configuration key '{section}.{property_name}' is missing and no default is set.")