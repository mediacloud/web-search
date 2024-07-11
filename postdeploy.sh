#!/bin/bash

if [ -z "$STACK_NAME" ]; then
    echo "STACK_NAME is not set, using local .env"
else
    echo "Attempting to apply environment for: $STACK_NAME"
    
    . web-search-config/web-search.$STACK_NAME.sh
fi

HOSTNAME=$(hostname --short)
python -m mc-manage.airtable-deployment-update --codebase 'web-search' --name $STACK_NAME --env $STACK_NAME --version "latest" --hardware $HOSTNAME
