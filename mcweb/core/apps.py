from django.apps import AppConfig
from django.core.management import call_command
from . import signals
import sys

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'


