"""
Simple Unix-domain socket syslog sink for writing rotating log files
Adapted from story-indexer/indexer/scripts/syslog-sink.py

Implements simple legacy BSD syslog protocol (implemented in python
SysLogHandler) but does NOT expect legacy date/time format!!

This is a standalone script
(but gets some path information from settings.py)

Can be tested using "logger -u data/logs/syslog.sock -p PRIO message..."
(default is facility code 1, use kern.PRIO for code 0)
"""

import argparse
import logging
import os
import socket
import time
import logging
import logging.config
from logging.handlers import SysLogHandler # for priority bits

# PyPI:
import yaml

# mcweb/backend/util
from .syslog_config import LOG_DIR, SYSLOG_CONFIG, SYSLOG_SOCKET

logger = logging.getLogger("syslog")

# byte values:
NUL = 0
LT = ord("<")

MAXMSG = 64 * 1024
DEF_FAC_PRIO = logging.INFO

# map syslog priorities to Python logging levels
# (allows SYSLOG_CONFIG to determine what gets saved)
SYSLOG2LOGGING = {
    SysLogHandler.LOG_EMERG: logging.CRITICAL,
    SysLogHandler.LOG_ALERT: logging.CRITICAL,
    SysLogHandler.LOG_CRIT: logging.CRITICAL,
    SysLogHandler.LOG_ERR: logging.ERROR,
    SysLogHandler.LOG_WARNING: logging.WARNING,
    SysLogHandler.LOG_NOTICE: logging.WARNING,
    SysLogHandler.LOG_INFO: logging.INFO,
    SysLogHandler.LOG_DEBUG: logging.DEBUG,
}


def parse_msg(msg: bytes) -> tuple[int, bytes]:
    if msg[-1] == NUL:
        msg = msg[:-1]

    if msg[0] != LT or b">" not in msg[1:]:
        return (DEF_FAC_PRIO, msg)

    fpb, msg = msg[1:].split(b">", 1)
    facpri = int(fpb)
    return (facpri, msg)

config_last_modified = None

def read_log_config(fname: str) -> bool:
    global config_last_modified

    try:
        with open(fname) as f:
            st = os.fstat(f.fileno())
            if config_last_modified and st.st_mtime <= config_last_modified:
                logger.debug("%s file has not changed", fname)
                return False
            config_dict = yaml.full_load(f)
            # NOTE! by default will disable local logger!
            logging.config.dictConfig(config_dict)
            logger.info("loaded %s", fname)
            config_last_modified = st.st_mtime
            return True
    except (OSError, ValueError, ValueError, TypeError, AttributeError, ImportError) as e:
        logger.error("error reading %s: %r", fname, e)
        return False

def main() -> None:
    ap = argparse.ArgumentParser("syslog-sink")
    ap.add_argument("--config-check-seconds", "-c", default=60)
    ap.add_argument("--debug", "-d", action="store_true", default=False)
    args = ap.parse_args()

    # may be wiped out by "disable_existing_loggers" in config file?
    h = logging.StreamHandler()
    h.setFormatter(logging.Formatter(fmt="%(asctime)s %(levelname)s: %(message)s"))
    logger.addHandler(h)
    if args.debug:
        logger.setLevel(logging.DEBUG)
        logger.debug("Buhler?")
    else:
        logger.setLevel(logging.INFO)

    if not os.path.isdir(LOG_DIR):
        os.makedirs(LOG_DIR)

    s = socket.socket(socket.AF_UNIX, socket.SOCK_DGRAM)
    if os.path.exists(SYSLOG_SOCKET):
        os.unlink(SYSLOG_SOCKET)
    s.bind(SYSLOG_SOCKET)

    logger.info("syslog sink started, listening on %s", SYSLOG_SOCKET)

    loggers: dict[str, logging.Logger] = {}
    next_config_check = 0.0

    while True:
        now = time.monotonic()
        if now > next_config_check:
            if read_log_config(SYSLOG_CONFIG):
                logger.info("re-read %s", SYSLOG_CONFIG)
                next = args.config_check_seconds
            else:               # log read failed
                next = 60       # check again in a minute
            next_config_check = now + next

        msg, addr = s.recvfrom(MAXMSG)
        facpri, msg = parse_msg(msg)

        if not msg:
            continue  # ignore if empty message

        ipri = facpri & SysLogHandler.LOG_DEBUG  # input prio
        logpri = SYSLOG2LOGGING[ipri]  # map to Python logging prio

        # don't bother with pre-defined facility names
        # (they apply to Unix daemons)
        facname = f"facility_{facpri >> 3}"

        # loggers & handlers must be configured by log_config_file!!!
        fac_logger = loggers.get(facname)
        if not fac_logger:
            fac_logger = loggers[facname] = logging.getLogger(facname)
        fac_logger.log(logpri, msg.decode("utf-8"))

if __name__ == "__main__":
    main()
