#!/bin/sh

# create or destroy web-search server as a dokku app
# Phil Budne, August 2014
# (after rss-fetcher/dokku-scripts/instance.sh, September 2022)

FQDN=$(hostname -f)
if [ "x$(whoami)" = xroot ]; then
    echo "run as normal user" 1>&2
    exit 1
else
    dokku() {
	ssh dokku@$FQDN "$*"
    }

    if ! dokku version | grep -q 'dokku version'; then
	echo "ssh dokku@$FQDN failed; need to run 'dokku ssh-keys' as root first" 1>&2
	exit 1
    fi
fi

OP=$1
TYPE=$2

# initial name, modified by instance type; used for service names
APP=mcweb

case "$OP" in
create|destroy)
    # Update push.sh if you change this:
    case "$TYPE" in
    dev-?*) APP=$(echo "$TYPE" | sed 's/^dev-//')-${APP};;
    prod) ;;
    staging) APP=${APP}-staging;;
    *) ERR=1;;
    esac
    ;;
*) ERR=1;;
esac

if [ -n "$ERR" ]; then
    echo "Usage: $0 create|destroy dev-USER|prod|staging" 1>&2
    exit 1
fi


# must agree with push.sh:
APP_FQDN=$APP.$FQDN
DOKKU_GIT_REMOTE=mcweb_$(echo "$TYPE" | sed 's/^dev-//')
PG_SVC=${APP}-db
REDIS_SVC=${APP}-cache

APP_PORT=8000


# copied from rss-fetcher/dokku-scripts/instance.sh
check_service() {
    local PLUGIN=$1
    shift
    local SERVICE=$1
    shift
    local APP=$1
    shift
    local CREATE_OPTIONS=$1

    if dokku plugin:list | awk '{ print $1 }' | grep -Fqx "$PLUGIN"; then
	echo found $PLUGIN plugin
    else
	echo plugin $PLUGIN not installed 1>&2
	exit 1
    fi

    if dokku $PLUGIN:exists $SERVICE >/dev/null 2>&1; then
	echo "found $PLUGIN service $SERVICE"
    else
	echo creating $PLUGIN service $SERVICE $CREATE_OPTIONS
	dokku $PLUGIN:create $SERVICE $CREATE_OPTIONS
    fi

    if dokku $PLUGIN:linked $SERVICE $APP >/dev/null 2>&1; then
	echo "found $PLUGIN service $SERVICE link to app $APP"
    else
	echo linking $PLUGIN service $SERVICE to app $APP
	dokku $PLUGIN:link $SERVICE $APP
    fi
}

create_app() {
    if dokku apps:exists $APP >/dev/null 2>&1; then
	echo found app $APP
    else
	echo creating app $APP
	dokku apps:create $APP
    fi

    check_service postgres $PG_SVC $APP
    check_service redis $REDIS_SVC $APP

    if git remote | grep $DOKKU_GIT_REMOTE >/dev/null; then
	echo found git remote $DOKKU_GIT_REMOTE
    else
	echo adding git remote $DOKKU_GIT_REMOTE
	git remote add $DOKKU_GIT_REMOTE dokku@$FQDN:$APP
    fi

    if dokku domains:report $APP | grep "vhosts:.*$APP_FQDN" >/dev/null 2>&1; then
	echo found domain $APP_FQDN
    else
	echo adding domain $APP_FQDN to $APP
	dokku domains:add $APP $APP_FQDN
    fi

    # needed because dokku PORT env var not honored??
    if dokku ports:help >/dev/null 2>&1; then
	# newer version of dokku
	if dokku ports:list $APP | grep -q " $APP_PORT\$"; then
	    echo found port $APP_PORT mapping
	else
	    echo adding port $APP_PORT mapping
	    dokku ports:add $APP http:80:$APP_PORT
	fi
    else
	# older version of dokku
	if dokku proxy:ports | grep -q $APP_PORT; then
	    echo found proxy port $APP_PORT mapping
	else
	    echo adding proxy port $APP_PORT mapping
	    dokku proxy:ports-add http:80:$APP_PORT
	fi
    fi

    # get git commit hash of last change to this file
    SCRIPT_HASH=$(git log -n1 --oneline --no-abbrev-commit --format='%H' $0)
    dokku config:set --no-restart $APP INSTANCE_SH_GIT_HASH=$SCRIPT_HASH
}

# copied from rss-fetcher/dokku-scripts/instance.sh
destroy_service() {
    PLUGIN=$1
    SERVICE=$2
    if dokku $PLUGIN:exists $SERVICE >/dev/null 2>&1; then
        if dokku $PLUGIN:linked $SERVICE $APP; then
            echo unlinking $PLUGIN service $SERVICE
            dokku $PLUGIN:unlink $SERVICE $APP
        fi
	# destroy commands ask for service name for confirmation: bug or feature??
	# (add --force to suppress??)
        dokku $PLUGIN:destroy $SERVICE
    fi
}

destroy_app() {
    if dokku apps:exists $APP >/dev/null 2>&1; then
	dokku apps:destroy $APP
    fi
    destroy_service redis $REDIS_SVC
    destroy_service postgres $PG_SVC
}

case "$OP" in
create) create_app;;
destroy) destroy_app;;
*) echo "SHOULD NOT HAPPEN" 1>&2; exit 1;;
esac

