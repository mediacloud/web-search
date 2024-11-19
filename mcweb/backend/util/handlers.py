import logging.handlers

class SysLogHandler(logging.handlers.SysLogHandler):
    def handleError(self, record):
        pass
