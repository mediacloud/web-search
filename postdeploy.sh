#!/bin/bash
HOSTNAME=$(hostname --short)
python -m mc-manage.airtable-deployment-update --codebase 'web-search' --name $STACK_NAME --env $STACK_NAME --version "latest" --hardware $HOSTNAME
