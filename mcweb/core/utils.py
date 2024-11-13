from .models import ConfigProperty

def get_config_value(key):
    try:
        return ConfigProperty.objects.get(property_name=key).property_value
    except ConfigProperty.DoesNotExist:
        raise ValueError(f"Configuration key '{key}' is missing and no default is set.")