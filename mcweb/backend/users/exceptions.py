from mc_providers import PLATFORM_TWITTER


class OverQuotaException(Exception):
    def __init__(self, provider: str, limit: int):
        super().__init__("You have used up your quota for {} - {} hits per week".format(provider, limit))
