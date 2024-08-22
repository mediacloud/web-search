#!/bin/sh

# create or destroy web-search server as a dokku app
# Phil Budne, August 2014
# (after rss-fetcher/dokku-scripts/instance.sh, September 2022)

SCRIPT_DIR=$(dirname $0)

OP=$1
INSTANCE=$2

TMPFILE=/var/tmp/mcweb-instance$$
trap "rm -f $TMPFILE" 0

if [ "x$(whoami)" = xroot ]; then
    echo "run as normal user with dokku ssh access (via dokku ssh-keys:add)" 1>&2
    exit 1
fi

case "$OP" in
create|destroy)
    # Update push.sh if you change how instances are named
    case "$INSTANCE" in
    prod|staging)
	;;
    *)
	if ! id $INSTANCE >/dev/null 2>&1; then
	    echo "$0: user $INSTANCE does not exist"
	    exit 1
	fi
	;;
    esac
    ;;
*) ERR=1;;
esac

if [ -n "$ERR" ]; then
    echo "Usage: $0 create|destroy prod|staging|USERNAME" 1>&2
    echo '   "create" can be re-run, will only update as-needed.' 1>&2
    exit 1
fi


# after INSTANCE set, sets APP:
. $SCRIPT_DIR/common.sh

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

    dokku domains:report $APP > $TMPFILE
    for DOMAIN in $APP_FQDN $EXTRA_DOMAINS; do
	if grep -q "vhosts:.*$DOMAIN" $TMPFILE; then
	    echo found domain $DOMAIN for $APP
	else
	    echo adding domain $DOMAIN to $APP
	    dokku domains:add $APP $DOMAIN
	fi
    done

    if git remote | grep $DOKKU_GIT_REMOTE >/dev/null; then
	echo found git remote $DOKKU_GIT_REMOTE
    else
	echo adding git remote $DOKKU_GIT_REMOTE
	git remote add $DOKKU_GIT_REMOTE dokku@$FQDN:$APP
    fi

    # XXX if staging, 

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

    if public_server; then
	if ! dokku letsencrypt:active $APP >/dev/null; then
	    echo enabling lets encrypt
	    # This requires $APP.$HOST.$PUBLIC_DOMAIN to be visible from Internet:
	    dokku letsencrypt:enable $APP
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
*) echo "$0: unknown command $OP" 1>&2; exit 1;;
esac

