
class UnsupportedOperationException(Exception):
    pass


class UnknownProviderException(Exception):
    def __init__(self, platform, source):
        super().__init__("Unknown provider {} from {}".format(platform, source))


class UnavailableProviderException(Exception):
    def __init__(self, platform, source):
        super().__init__("Unavailable provider {} from {}".format(platform, source))