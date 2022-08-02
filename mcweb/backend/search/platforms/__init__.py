import logging
from typing import List
import os

from .provider import ContentProvider
from .reddit import RedditPushshiftProvider
from .twitter import TwitterTwitterProvider
from .youtube import YouTubeYouTubeProvider
from .onlinenews import OnlineNewsMediaCloudProvider, OnlineNewsWaybackMachineProvider

YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', None)
TWITTER_API_BEARER_TOKEN = os.getenv('TWITTER_API_BEARER_TOKEN', None)
MEDIA_CLOUD_API_KEY = os.getenv('MEDIA_CLOUD_API_KEY', None)

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
PLATFORM_SOURCE_MEDIA_CLOUD = 'mediacloud'
PLATFORM_SOURCE_WAYBACK_MACHINE = 'waybackmachine'


def available_platforms() -> List[str]:
    platforms = []
    if TWITTER_API_BEARER_TOKEN:
        platforms.append(PLATFORM_TWITTER + " / " + PLATFORM_SOURCE_TWITTER)
    if YOUTUBE_API_KEY:
        platforms.append(PLATFORM_YOUTUBE + " / " + PLATFORM_SOURCE_YOUTUBE,)
    if MEDIA_CLOUD_API_KEY:
        platforms.append(PLATFORM_ONLINE_NEWS + " / " + PLATFORM_SOURCE_MEDIA_CLOUD,)
    platforms.append(PLATFORM_REDDIT + " / " + PLATFORM_SOURCE_PUSHSHIFT,)
    platforms.append(PLATFORM_ONLINE_NEWS + " / " + PLATFORM_SOURCE_WAYBACK_MACHINE,)
    return platforms


def provider_for(platform: str, source: str) -> ContentProvider:
    """
    A factory method that returns the appropriate data provider. Throws an exception to let you know if the
    arguments are unsupported.
    :param platform: One of the PLATFORM_* constants above.
    :param source: One of the PLATFORM_SOURCE>* constants above.
    :return:
    """
    if TWITTER_API_BEARER_TOKEN and (platform == PLATFORM_TWITTER) and (source == PLATFORM_SOURCE_TWITTER):
        platform_provider = TwitterTwitterProvider(TWITTER_API_BEARER_TOKEN)
    elif (platform == PLATFORM_REDDIT) and (source == PLATFORM_SOURCE_PUSHSHIFT):
        platform_provider = RedditPushshiftProvider()
    elif YOUTUBE_API_KEY and (platform == PLATFORM_YOUTUBE) and (source == PLATFORM_SOURCE_YOUTUBE):
        platform_provider = YouTubeYouTubeProvider(YOUTUBE_API_KEY)
    elif MEDIA_CLOUD_API_KEY and (platform == PLATFORM_ONLINE_NEWS) and (source == PLATFORM_SOURCE_MEDIA_CLOUD):
        platform_provider = OnlineNewsMediaCloudProvider(MEDIA_CLOUD_API_KEY)
    elif (platform == PLATFORM_ONLINE_NEWS) and (source == PLATFORM_SOURCE_WAYBACK_MACHINE):
        platform_provider = OnlineNewsWaybackMachineProvider()
    else:
        raise UnknownProviderException(platform, source)
    return platform_provider


class UnknownProviderException(Exception):
    def __init__(self, platform, source):
        super().__init__("Unknown provider {} from {}".format(platform, source))
