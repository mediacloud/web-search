#!/bin/sh

echo env:
env

echo "=== Environment Var Debug ==="
echo "Current user: $(whoami)"
echo "Current working directory: $(pwd)"
echo "Python path: $(which python)"
echo "Django settings module: $DJANGO_SETTINGS_MODULE"

echo "=== Checking specific environment variables ==="
for var in RSS_FETCHER_URL RSS_FETCHER_USER RSS_FETCHER_PASS SECRET_KEY EARLIEST_AVAILABLE_DATE; do
    echo "$var=${!var:-NOT_SET}"
done

echo "=== Testing Django environment loading ==="
python -c "
import os
import sys
sys.path.insert(0, 'mcweb')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')
try:
    import django
    django.setup()
    from django.conf import settings
    print('Django settings loaded successfully')
    print(f'SECRET_KEY present: {hasattr(settings, \"SECRET_KEY\")}')
    print(f'RSS_FETCHER_URL present: {hasattr(settings, \"RSS_FETCHER_URL\")}')
except Exception as e:
    print(f'Django setup failed: {e}')
    import traceback
    traceback.print_exc()
"


echo "Running migrations and building javacsript"
python mcweb/manage.py makemigrations
python mcweb/manage.py migrate
npm run build
python mcweb/manage.py collectstatic --noinput
echo "  done with migrations and javascript build"

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
