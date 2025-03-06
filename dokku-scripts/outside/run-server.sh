#!/bin/sh

# run web server outside Dokku for casual developers: see README.md

_BASE_DIR=$(dirname $0)
. $_BASE_DIR/dokku-vars.sh

# will require different ports for multiple users/instances on same server!!
if [ "x$_OUTSIDE_PORT" = x ]; then
    _OUTSIDE_PORT=8000
fi

cd $_WEB_SEARCH
echo "open URL http://$ALLOWED_HOSTS:$_OUTSIDE_PORT"
$_VENV_BIN/gunicorn --pythonpath mcweb \
		    --bind 0.0.0.0:$_OUTSIDE_PORT \
		    mcweb.wsgi
