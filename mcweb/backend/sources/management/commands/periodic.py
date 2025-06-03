"""
management command to run periodic/INTERVAL/* scripts

Doesn't REALLY belong under "sources", but more related
to sources than to searches or users!
"""

import fcntl
import glob
import logging
import os
import sys

from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)

# Directory containing per-interval subdirectories.  Currently
# expected at top level!  NOT in "django-scripts" because not tied to
# django (tho if "django-scripts" was renamed "deployment"....)
PERIODIC_BASE = 'periodic'

# allows use of multiple containers (data is a shared volume)
LOCK_BASE = "data/locks/periodic"

def run_periodic_scripts(interval: str) -> None:
    if interval[0] == "." or os.sep in interval:
        logger.error("bad directory name: %s", dir)
        sys.exit(1)
        
    script_dir = os.path.join(PERIODIC_BASE, interval)
    if not os.path.isdir(script_dir):
        logger.error("%s directory not found", script_dir)
        sys.exit(1)

    lock_dir = os.path.join(LOCK_BASE, interval)
    if not os.path.isdir(lock_dir):
        os.makedirs(lock_dir)

    found = success = 0
    scripts = os.listdir(script_dir)
    scripts.sort()              # sort in place
    for script_name in scripts:
        if (script_name.startswith((".", "#")) or
            script_name.endswith(("#", "~"))):
            continue

        found += 1

        # Using an POSIX file lock because they go away when the
        # process exits (ie; even if the container is killed, or the
        # process is killed with SIGKILL).  Linux won't execute a
        # shell script if there is a lock on it, so a separate lock
        # file is needed.

        lockfile = os.path.join(lock_dir, script_name)
        try:
            with open(lockfile, "w") as f:
                script_path = os.path.join(script_dir, script_name)
                try:
                    # try to get an exclusive lock, without blocking
                    fcntl.lockf(f.fileno(), fcntl.LOCK_NB|fcntl.LOCK_EX)
                except BlockingIOError:
                    logger.info("%s locked: skipping", script_path)
                    continue
                # here with lockfile locked
                logger.info("%s starting", script_path)

                # Run the script, via a shell, without redirection or
                # piping (for that, use the subprocess module).  The
                # only reason system will raise an exception is if the
                # argument is not a string (can't happen here).
                status = os.system(script_path)
                if status == 0:
                    logger.info("%s done", script_path)
                else:
                    logger.error("%s failed, status %#x", script_path, status)

                # Be tidy, and clean up the lockfile, while we still
                # hold the lock on it (so we KNOW we're not removing
                # anyone else's lock)!  This is not NECESSARY, so long
                # as every process runs with under the same user and
                # can open the file for write (the existance of the
                # file doesn't mean someone holds the lock).
                os.unlink(lockfile)
        except:
            log.exception("could not open lock file %s", lockfile)
        success += 1
    logger.info("%d found, %d successful", found, success)

class Command(BaseCommand):
    help = 'Run periodic scripts with locking'

    def add_arguments(self, parser):
        parser.add_argument("interval", type=str)

    def handle(self, *args, **options):
        run_periodic_scripts(options["interval"])
