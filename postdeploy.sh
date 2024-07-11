#!/bin/bash
HOSTNAME=$(hostname --short)
BRANCH=$(git branch --show-current)
VERSION=$(git describe --tags)
python -m mc-manage.airtable-deployment-update --codebase 'web-search' --name $BRANCH --env $STACK_NAME --version $VERSION --hardware $HOSTNAME
