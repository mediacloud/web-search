# PyPI
import constance

from mc_providers import provider_by_name
from mc_providers.provider import Trace


def get_provider(name: str, *, session_id: str, caching: int, api_key: str | None = None):
    """
    The one place to call into mc-providers to get a Provider object.
    This routine is NOT for general use!!!!
    Search calls should use pq_provider
    Background tasks should use tasks.get_task_provider
    """

    provider = provider_by_name(name, api_key=api_key, caching = caching,
            software_id="web-search", session_id = session_id)
    if constance.config.LOG_RAW_QUERY_ENABLED:
        provider.set_trace(Trace.RAW_QUERY)
    return provider

# get_task_provider moved next door to tasks.py
