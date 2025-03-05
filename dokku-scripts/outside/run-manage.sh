#!/bin/sh

_BASE_DIR=$(dirname $0)
. $_BASE_DIR/dokku-vars.sh

cd $_WEB_SEARCH
$_PYTHON mcweb/manage.py "$@"
