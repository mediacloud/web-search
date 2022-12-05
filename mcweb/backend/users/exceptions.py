from backend.search.providers import PLATFORM_TWITTER


class OverQuotaException(Exception):
    def __init__(self, provider: str, limit: int):
        if provider.startswith(PLATFORM_TWITTER):
            super().__init__("You're limited to {} quieries per week against Twitter's API. We're still working on "
                             "a \"bring your own API key\" feauture.".format(limit))
        else:
            super().__init__("You have used up your quota for {} - {} hits per week".format(provider, limit))
