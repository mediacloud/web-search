#!/bin/bash

echo "Running migrations and building javacsript"
python mcweb/manage.py migrate
npm run build
python mcweb/manage.py collectstatic --noinput
echo "  done with migrations and javascript build"


###get the config variables from github (avoiding referencing directly)
#This is just for reference
printenv > /tmp/dokku_predeploy_env.txt

if [ -z "$DOKKU_APP_NAME" ]; then
    echo "DOKKU_APP_NAME is not set"
    exit 1
else
    echo "DOKKU_APP_NAME is set to $DOKKU_APP_NAME"
    if [[ "$DOKKU_APP_NAME" == "mcweb" ]]; then
    	ENV_TYPE = "prod"
    elif [[ "$DOKKU_APP_NAME" == "mcweb-staging" ]]; then
    	ENV_TYPE = "staging"

fi

git clone git@github.com:mediacloud/web-search-config.git

cp "web-search-config/web-search.$ENV_TYPE.sh mcweb/.env"
