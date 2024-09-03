from django.apps import AppConfig
import mc_providers
from settings import PROVIDERS_TIMEOUT


class SearchConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.search'
    # set a default timeout for all providers
    print(f"setting default timeout at: {PROVIDERS_TIMEOUT}")
    mc_providers.set_default_timeout(PROVIDERS_TIMEOUT)
