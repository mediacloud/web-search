import constance
from mc_providers import provider_by_name
from settings import SENTRY_ENV

import logging

logger = logging.getLogger(__name__)


def get_provider(name: str, *, session_id: str, caching: int, api_key: str | None = None):
    """
    The one place to call into mc-providers to get a Provider object.
    This routine is NOT for general use!!!!
    Search calls should use pq_provider
    Background tasks should use get_task_provider
    """

    # BEGIN TEMPORARY CROCKERY!
    extras = {}
    if name == 'onlinenews-mediacloud':
        if constance.config.ES_PARTIAL_RESULTS:
            # new provider: return results even if some shards failed
            # with circuit breaker tripping:
            extras["partial_responses"] = True
    logger.debug("pq_provider %s %r", name, extras)
    # END TEMPORARY CROCKERY

    return provider_by_name(name, api_key=api_key, caching = caching,
            software_id="web-search", session_id = session_id)


def provider_session(task_name:str):
    return 'f{task_name}@{SENTRY_ENV}'


def get_task_provider(provider_name: str, task_name: str):
    session = provider_session(task_name)
    return get_provider(provider_name, session_id=session, caching=0)
