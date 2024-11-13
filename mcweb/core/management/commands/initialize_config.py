from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import ConfigProperty

class Command(BaseCommand):
    help = "Initialize configuration properties with default values from settings"

    def handle(self, *args, **kwargs):
        for key, config in settings.CONFIG_DEFAULTS.items():
            config_property, created = ConfigProperty.objects.get_or_create(
                property_name=key,
                defaults={"property_value": str(config["value"]), "property_type": config["type"].__name__}
            
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created {key} with default value"))
            else:
                self.stdout.write(f"{key} already exists in the config database.")