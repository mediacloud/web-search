#!/bin/sh

echo env:
env

echo "Running migrations and building javacsript"
python mcweb/manage.py makemigrations
python mcweb/manage.py migrate
npm run build
python mcweb/manage.py collectstatic --noinput
echo "  done with migrations and javascript build"
python mcweb/manage.py create-groups

# also set in settings.py
LOGDIR=data/logs
if [ ! -d $LOGDIR ]; then
    mkdir -p $LOGDIR
fi
if ! cmp -s syslog.yml.proto $LOGDIR/syslog.yml.proto; then
    if [ -f $SYSLOG_YML ]; then
	echo saving old $LOGDIR/syslog.yml
	mv $LOGDIR/syslog.yml $LOGDIR/syslog.yml.saved
    fi
    echo installing new syslog.yml
    cp -p syslog.yml.proto $LOGDIR/syslog.yml
    cp -p syslog.yml.proto $LOGDIR/syslog.yml.proto
fi
chown -R herokuishuser:herokuishuser $LOGDIR
