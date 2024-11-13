from django.apps import AppConfig
from django.core.management import call_command

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    #This command reads the values of CONFIG_DEFAULTS in settings.py into the database. 
    def ready(self):
        call_command("initialize_config")

