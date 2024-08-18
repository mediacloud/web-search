#!/bin/sh

# clone production mcweb database
# for development/testing.

DB="$1"

PROD=tarbell.angwin

FQDN=$(hostname -f)
PROD_DB=mcweb-db

SCRIPT_DIR=$(dirname $0)

if [ "x$DB" = x ]; then
    echo "Usage: $0 NAME-mcweb-db" 1>&2
    exit 1
fi

if [ $(whoami) = root ]; then
    if [ $FQDN = $PROD ]; then
	alias prod=dokku
    else
	alias prod="ssh dokku@$PROD"
    fi
    alias local=dokku
else
    alias prod="ssh dokku@$PROD"
    alias local="ssh dokku@$FQDN"
fi

echo checking $PROD_DB access
if ! prod postgres:exists $PROD_DB >/dev/null 2>&1; then
    echo "cannot access $PROD $PROD_DB" 1>&2
    exit 2
fi
echo checking if $DB exists
if ! local postgres:exists $DB >/dev/null 2>&1; then
    echo "cannot access $DB" 1>&2
    exit 2
fi

echo starting copy...
prod postgres:export $PROD_DB | local postgres:import $DB
