from django.apps import AppConfig
from django.core.management import call_command
import sys

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    #This command reads the values of CONFIG_DEFAULTS in settings.py into the database. 
    #But only when the app is actually deployed- db isn't always ready in other contexts.
    def ready(self):
        if 'collectstatic' not in sys.argv:
            call_command("initialize_config")

