from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import ConfigProperty

class Command(BaseCommand):
    help = "Initialize configuration properties with default values from settings"

    def handle(self, *args, **kwargs):
        for section_name, config_section in settings.CONFIG_DEFAULTS.items()
            for key, config in config_section.items():
                config_property, created = ConfigProperty.objects.get_or_create(
                    property_name=key,
                    defaults={"section":section_name, "property_value": str(config["value"]), "property_type": config["type"].__name__}
                
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created {section_name}.{key} with default value"))
                else:
                    self.stdout.write(f"{key} already exists in the config database.") 