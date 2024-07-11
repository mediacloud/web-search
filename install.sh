#!/bin/bash

echo "Running migrations and building javacsript"
python mcweb.manage.py makemigrations
python mcweb.manage.py migrate
npm run build
python mcweb/manage.py collectstatic --noinput
echo "  done with migrations and javascript build"


###get the config variables from github (avoiding referencing directly)
#This is just for reference
echo $STACK_NAME

if [ -z "$STACK_NAME" ]; then
    echo "STACK_NAME is not set, using local .env"
else
    echo "deploying $STACK_NAME stack"
    git clone git@github.com:mediacloud/web-search-config.git
    cp "web-search-config/web-search.$STACK_NAME.sh" mcweb/.env
fi


