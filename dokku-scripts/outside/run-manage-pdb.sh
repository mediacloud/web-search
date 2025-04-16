#!/bin/sh

# run a manage command under python debugger

_BASE_DIR=$(dirname $0)
. $_BASE_DIR/dokku-vars.sh

cd $_WEB_SEARCH
$_PYTHON -mpdb mcweb/manage.py "$@"
