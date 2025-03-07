#!/bin/sh

_BASE_DIR=$(dirname $0)

QUEUE_NAME=$1
if echo "$QUEUE_NAME" | egrep -q '^(user|system|admin)-(fast|slow)$'; then
   echo queue $QUEUE_NAME
else
    echo "Need queue name: {user,system,admin}-{fast,slow}" 2>&1
    exit 1
fi

$_BASE_DIR/run-manage.sh process_tasks --queue $QUEUE_NAME
