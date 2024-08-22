# sourced by instance.sh & push.sh after INSTANCE set

if [ -z "$SCRIPT_DIR" -o ! -f "$SCRIPT_DIR/common.sh" ]; then
    echo common.sh: SCRIPT_DIR not set 1>&2
    exit 1
fi

BASE_APP=mcweb

# Internet visible domain
PUBLIC_DOMAIN=mediacloud.org

# Internet visible server
PUBLIC_SERVER=tarbell

public_server() {
    # replace with true if all servers public:
    test "$HOST" = "$PUBLIC_SERVER"
}

if [ "x$INSTANCE" = prod ]; then
    APP=$BASE_APP
else
    # INSTANCE is staging or username
    # consistent with story-indexer and rss-fetcher ordering:
    APP=${INSTANCE}-${BASE_APP}
fi

# TODO: use to generate set ALLOWED_HOSTS
case "$INSTANCE" in
prod)
    APP_FQDN=search.${PUBLIC_DOMAIN}
    ;;
staging)
    # note mcweb-staging word order different from APP name
    APP_FQDN=mcweb-staging.${PUBLIC_SERVER}.${PUBLIC_DOMAIN}
    ;;
*)
    APP_FQDN=${APP}.${FQDN}
    ;;
esac

# git remote for app; created by instance.sh, used by push.sh
DOKKU_GIT_REMOTE=${BASE_APP}_$INSTANCE

FQDN=$(hostname -f)
HOST=$(hostname -s)

dokku() {
    ssh dokku@$FQDN "$*"
}

# check ssh access working:
if ! dokku version | grep -q '^dokku version'; then
    echo "ssh dokku@$FQDN failed; need to run 'dokku ssh-keys' first" 1>&2
    exit 1
fi

# service names: NOTE! need not have suffix!
PG_SVC=${APP}-db
REDIS_SVC=${APP}-cache

# exit status of config.sh
CONFIG_STATUS_CHANGED=0
CONFIG_STATUS_ERROR=1
CONFIG_STATUS_NOCHANGE=2

INSTANCE_SH=$SCRIPT_DIR/instance.sh
# git hash of last change to instance.sh
# name of dokku config var set by instance.sh, checked by push.sh:
INSTANCE_HASH_VAR=INSTANCE_SH_GIT_HASH
instance_sh_file_git_hash() {
    git log -n1 --oneline --no-abbrev-commit --format='%H' $INSTANCE_SH
}
