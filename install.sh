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

if [ -z "$STACK_NAME"]; then
    echo "STACK_NAME is not set, using local .env"
else
    if [ -z ${GITHUB_USR} || -z ${GITHUB_PAT} ]; then
        echo "Can't deploy $STACK_NAME without setting GITHUB_USR and GITHUB_PAT"
    echo "deploying $STACK_NAME stack"
    
    https://$GITHUB_USR:$GITHUB_PAT>@github.com/mediacloud/web-search-config.git
    cp "web-search-config/web-search.$STACK_NAME.sh" mcweb/.env
fi


