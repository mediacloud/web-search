#!/bin/sh

# run scripts in a periodic subdirectory
# via Dokku app.json cron tasks
PERIOD=${1:-novalue}

# redirect stdout and stderr to log for help
# seeing why things may not have run without email.
# (not rotated, so keep only last invocation)
exec >> data/logs/run-periodic-$PERIOD.log 2>& 1

log() {
    echo `date '+%F %T'` $*
}

if [ "x$PERIOD" = x ]; then
    log "run-periodic.sh requires argument"
    exit 1
fi

DIR="periodic/$PERIOD"
if [ ! -d "$DIR" ]; then
    log "no $DIR directory"
    exit 1
fi

if [ "x$PERIODIC_HOUR" = x ]; then
    log "PERIODIC_HOUR not set"
    exit 1
fi

# app.json entries are the same for all deployments (not generated /
# templated the way crontab was), and don't want staging and
# production to be running the same ES intensive tasks at the same
# time.  tarbell (UMass Dokku production server is in US Eastern time
# zone, so any tasks run at 1:xx could be run twice in the fall, and
# any tasks run at 2:xx could be skipped in the spring (unless or
# until Daylight Time goes away, which always seems to be "real soon",
# except that the US tried it in 1974, and cancelled it almost
# immediately! [Phil: I've wondered if Boston would be better off in
# the Atlantic time zone?])

# NOTE! choice of PERIODIC_HOUR is not completely arbitrary: it MUST
# ALSO be one of the hours the script is run in app.json!!!
case "$PERIODIC_HOUR" in
[12]|0[12]) log "bad PERIODIC_HOUR: $PERIODIC_HOUR"; exit 1;;
esac

HOUR=$(date +%k)
if [ "$HOUR" -ne "$PERIODIC_HOUR" ]; then
    log "not time: $PERIODIC_HOUR"
    exit 0
fi

log "starting run-parts"
run-parts --verbose "$DIR"
log "done $?"
