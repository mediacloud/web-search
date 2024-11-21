from .models import ConfigProperty
from util.cache import cache_by_kwargs

@cache_by_kwargs(60)
def get_property_value(section_name, property_name):
    return uncached_get_property_value(section_name, property_name)


def uncached_get_property_value(section_name, property_name):
    try:
        return ConfigProperty.objects.get(
            section_name=section_name,
            property_name=property_name).get_typed_value()
    except ConfigProperty.DoesNotExist:
        raise ValueError(f"Configuration key '{section_name}.{property_name}' is missing and no default is set.")