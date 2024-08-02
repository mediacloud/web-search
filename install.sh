#!/bin/bash

echo "Running migrations and building javacsript"
bin/start-pgbouncer
python mcweb/manage.py makemigrations
python mcweb/manage.py migrate
npm run build
python mcweb/manage.py collectstatic --noinput
echo "  done with migrations and javascript build"


###get the config variables from github (avoiding referencing directly)
#This is just for reference


if [ -z "$STACK_NAME" ]; then
    echo "STACK_NAME is not set, using local .env"
else
    echo "Attempting to deploy with stack name: $STACK_NAME"
    if [ -z ${GITHUB_USR} -o -z ${GITHUB_PAT} ]; then
        echo "wont deploy $STACK_NAME without a GITHUB_USR and GITHUB_PAT"
        exit 1
    fi
    echo "deploying $STACK_NAME stack"
    
    git clone https://"$GITHUB_USR":"$GITHUB_PAT"@github.com/mediacloud/web-search-config.git
    cp "web-search-config/web-search.$STACK_NAME.sh" mcweb/.env
    . web-search-config/web-search.$STACK_NAME.sh
fi


