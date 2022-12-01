
class ProviderException(Exception):
    pass


class UnsupportedOperationException(ProviderException):
    pass


class UnknownProviderException(ProviderException):
    def __init__(self, platform, source):
        super().__init__("Unknown provider {} from {}".format(platform, source))


class UnavailableProviderException(ProviderException):
    def __init__(self, platform, source):
        super().__init__("Unavailable provider {} from {}".format(platform, source))


class QueryingEverythingUnsupportedQuery(ProviderException):
    def __init__(self):
        super().__init__("Can't query everything")
