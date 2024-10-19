# pylint: disable=protected-access

import unittest
import os

import mc_providers

MEDIA_CLOUD_API_KEY = os.getenv('MEDIA_CLOUD_API_KEY', None)


class ModuleTest(unittest.TestCase):

    def test_provider_name(self):
        name = mc_providers.provider_name(mc_providers.PLATFORM_ONLINE_NEWS, mc_providers.PLATFORM_SOURCE_MEDIA_CLOUD)
        assert name == "onlinenews-mediacloud"

    def test_provider_for(self):
        provider = mc_providers.provider_for(mc_providers.PLATFORM_ONLINE_NEWS,
                                             mc_providers.PLATFORM_SOURCE_MEDIA_CLOUD, MEDIA_CLOUD_API_KEY, None)
        assert provider is not None
        assert isinstance(provider, mc_providers.onlinenews.OnlineNewsMediaCloudProvider) is True

    def test_default_timeout(self):
        # change it
        assert mc_providers.DEFAULT_TIMEOUT == 60
        mc_providers.set_default_timeout(120)
        assert mc_providers.DEFAULT_TIMEOUT == 120
        # make sure it flows into provider
        mc_providers.set_default_timeout(60)
        provider = mc_providers.provider_for(mc_providers.PLATFORM_ONLINE_NEWS,
                                             mc_providers.PLATFORM_SOURCE_MEDIA_CLOUD, MEDIA_CLOUD_API_KEY, None)
        assert provider._timeout == 60
        # make sure it flows into provider
        mc_providers.set_default_timeout(120)
        provider = mc_providers.provider_for(mc_providers.PLATFORM_ONLINE_NEWS,
                                             mc_providers.PLATFORM_SOURCE_MEDIA_CLOUD, MEDIA_CLOUD_API_KEY, None)
        assert provider._timeout == 120