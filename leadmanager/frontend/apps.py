from django.apps import AppConfig


# creating 'frontend' to be imported into leadmanager INSTALLED_APPS
class FrontendConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "frontend"
