
class OverQuotaException(Exception):
    def __init__(self, provider, limit):
        super().__init__("You have used up your quota for {} - {} hits per week".format(provider, limit))
