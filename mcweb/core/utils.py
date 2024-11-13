from .models import ConfigProperty

def get_config_value(key):
    try:
        config_entry = ConfigProperty.objects.get(property_name=key)
        return config_entry.get_typed_value()
    except ConfigProperty.DoesNotExist:
        raise ValueError(f"Configuration key '{key}' is missing and no default is set.")