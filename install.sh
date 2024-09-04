#!/bin/sh

echo env:
env

echo "Running migrations and building javacsript"
python mcweb/manage.py makemigrations
python mcweb/manage.py migrate
npm run build
python mcweb/manage.py collectstatic --noinput
echo "  done with migrations and javascript build"
