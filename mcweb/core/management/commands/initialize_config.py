from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import ConfigProperty

class Command(BaseCommand):
    help = "Initialize configuration properties with default values from settings"

    def handle(self, *args, **kwargs):
        for section_name, config_section in settings.CONFIG_DEFAULTS.items():
            self.stdout.write(f"Found config section {section_name}")
            for property_name, config in config_section.items():
                self.stdout.write(f"Found config {section_name}.{key}:{str(config['value'])}")
                config_property, created = ConfigProperty.objects.get_or_create(
                    property_name=property_name,
                    defaults={"section_name":section_name, "property_value": str(config["value"]), "property_type": config["type"].__name__}
                
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Created {section_name}.{property_name} with default value"))
                else:
                    self.stdout.write(f"{section_name}.{property_name} already exists in the config database.") 