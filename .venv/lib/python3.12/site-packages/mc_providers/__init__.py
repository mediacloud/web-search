import logging
from typing import List, Optional

from .exceptions import UnknownProviderException, UnavailableProviderException, APIKeyRequired
from .provider import ContentProvider
from .reddit import RedditPushshiftProvider
from .twitter import TwitterTwitterProvider
from .youtube import YouTubeYouTubeProvider
from .onlinenews import OnlineNewsWaybackMachineProvider, OnlineNewsMediaCloudProvider

logger = logging.getLogger(__name__)

# static list matching topics/info results
PLATFORM_TWITTER = 'twitter'
PLATFORM_REDDIT = 'reddit'
PLATFORM_YOUTUBE = 'youtube'
PLATFORM_ONLINE_NEWS = 'onlinenews'

# static list matching topics/info results
PLATFORM_SOURCE_PUSHSHIFT = 'pushshift'
PLATFORM_SOURCE_TWITTER = 'twitter'
PLATFORM_SOURCE_YOUTUBE = 'youtube'
PLATFORM_SOURCE_WAYBACK_MACHINE = 'waybackmachine'
PLATFORM_SOURCE_MEDIA_CLOUD = "mediacloud"

NAME_SEPARATOR = "-"

DEFAULT_TIMEOUT = 60  # to be used across all the providers; override via one-time call to set_default_timeout


def set_default_timeout(timeout: int):
    global DEFAULT_TIMEOUT
    DEFAULT_TIMEOUT = timeout


def provider_name(platform: str, source: str) -> str:
    return platform + NAME_SEPARATOR + source


def available_provider_names() -> List[str]:
    return [
        provider_name(PLATFORM_TWITTER, PLATFORM_SOURCE_TWITTER),
        provider_name(PLATFORM_YOUTUBE, PLATFORM_SOURCE_YOUTUBE),
        provider_name(PLATFORM_REDDIT, PLATFORM_SOURCE_PUSHSHIFT),
        provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_WAYBACK_MACHINE),
        provider_name(PLATFORM_ONLINE_NEWS, PLATFORM_SOURCE_MEDIA_CLOUD)
    ]


def provider_by_name(name: str, api_key: Optional[str], base_url: Optional[str],
                     timeout: Optional[int] = None,
                     caching: bool = True) -> ContentProvider:
    parts = name.split(NAME_SEPARATOR)
    return provider_for(parts[0], parts[1], api_key, base_url, timeout=timeout, caching=caching)


def provider_for(platform: str, source: str, api_key: Optional[str], base_url: Optional[str],
                 timeout: Optional[int] = None, caching: bool = True) -> ContentProvider:
    """
    A factory method that returns the appropriate data provider. Throws an exception to let you know if the
    arguments are unsupported.
    :param platform: One of the PLATFORM_* constants above.
    :param source: One of the PLATFORM_SOURCE>* constants above.
    :param api_key: The API key needed to access the provider.
    :param base_url: For custom integrations you can provide an alternate base URL for the provider's API server
    :param timeout: override the default timeout for the provider (in seconds)
    :return: the appropriate ContentProvider subclass
    """
    if timeout is None:
        timeout = DEFAULT_TIMEOUT
    available = available_provider_names()
    platform_provider: ContentProvider
    if provider_name(platform, source) in available:
        if (platform == PLATFORM_TWITTER) and (source == PLATFORM_SOURCE_TWITTER):
            if api_key is None:
                raise APIKeyRequired(platform)

            platform_provider = TwitterTwitterProvider(api_key, timeout, caching)

        elif (platform == PLATFORM_REDDIT) and (source == PLATFORM_SOURCE_PUSHSHIFT):
            platform_provider = RedditPushshiftProvider(timeout, caching)

        elif (platform == PLATFORM_YOUTUBE) and (source == PLATFORM_SOURCE_YOUTUBE):
            if api_key is None:
                raise APIKeyRequired(platform)

            platform_provider = YouTubeYouTubeProvider(api_key, timeout, caching)
        
        elif (platform == PLATFORM_ONLINE_NEWS) and (source == PLATFORM_SOURCE_WAYBACK_MACHINE):
            platform_provider = OnlineNewsWaybackMachineProvider(base_url, timeout, caching)

        elif (platform == PLATFORM_ONLINE_NEWS) and (source == PLATFORM_SOURCE_MEDIA_CLOUD):
            platform_provider = OnlineNewsMediaCloudProvider(base_url, timeout, caching)

        else:
            raise UnknownProviderException(platform, source)

        return platform_provider
    else:
        raise UnavailableProviderException(platform, source)
