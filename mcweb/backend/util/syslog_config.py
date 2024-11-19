# here for mcweb.backend.util.syslog and mcweb.setttings

# paths not expected to change!!!
# all paths relative to /app or web-search top-level
# under docker /app/data should be mapped to a volume:

LOG_DIR = "data/logs/"
SYSLOG_SOCKET = LOG_DIR + "syslog.sock"
SYSLOG_CONFIG = LOG_DIR + "syslog.yml"

