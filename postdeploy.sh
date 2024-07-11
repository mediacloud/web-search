#!/bin/bash

if [ -z "$STACK_NAME" ]; then
    echo "STACK_NAME is not set, using local .env"
else
    echo "Attempting to apply environment for: $STACK_NAME"
    tail web-search-config/websearch.$STACK_NAME.sh 
    . web-search-config/web-search.$STACK_NAME.sh
    echo $AIRTABLE_API_KEY
fi

HOSTNAME=$(hostname --short)
python -m mc-manage.airtable-deployment-update --codebase 'web-search' --name $STACK_NAME --env $STACK_NAME --version "latest" --hardware $HOSTNAME
