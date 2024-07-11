#!/bin/bash

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
    . web-search-config/web-search.$STACK_NAME.sh
fi

HOSTNAME=$(hostname --short)
python -m mc-manage.airtable-deployment-update --codebase 'web-search' --name $STACK_NAME --env $STACK_NAME --version "latest" --hardware $HOSTNAME
