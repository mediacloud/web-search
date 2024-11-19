# common values/routines for dokku-scripts
# sourced by instance.sh & push.sh after INSTANCE set

COMMON_SH=$SCRIPT_DIR/common.sh
if [ -z "$SCRIPT_DIR" -o ! -f "$COMMON_SH" ]; then
    echo common.sh: SCRIPT_DIR not set 1>&2
    exit 1
fi

BASE_APP=mcweb

# Internet visible domain
PUBLIC_DOMAIN=mediacloud.org

# Internet visible server
PUBLIC_SERVER=tarbell

# service name within public domain
PUBLIC_NAME=search

FQDN=$(hostname -f | tr A-Z a-z)
HOST=$(hostname -s)

public_server() {
    # replace with true if all servers public:
    test "$HOST" = "$PUBLIC_SERVER"
}

zzz() {
    echo $1 | tr 'A-Za-z' 'N-ZA-Mn-za-m'
}

CONFIG_REPO_ORG=zrqvnpybhq
CONFIG_REPO_PREFIX=$(zzz tvg@tvguho.pbz:$CONFIG_REPO_ORG)
CONFIG_REPO_NAME=$(zzz jro-frnepu-pbasvt)
GIT_ORG=$(zzz $CONFIG_REPO_ORG)

# check for local (non-mediacloud) overrides
LOCAL_SH=$SCRIPT_DIR/local.sh
if [ -f "$LOCAL_SH" ]; then
    . $LOCAL_SH
fi

if [ "x$INSTANCE" = xprod ]; then
    APP=$BASE_APP
else
    # INSTANCE is staging or username
    # consistent with story-indexer and rss-fetcher ordering:
    APP=${INSTANCE}-${BASE_APP}
fi

APP_FQDN=${APP}.${FQDN}

# used in instance.sh to set app domains, used to set config in push.sh:
ALLOWED_HOSTS=${APP_FQDN}
case "$INSTANCE" in
prod)
    # if on public (Internet visible server) with letsencrypt cert,
    # can only have public names in dokku:domains
    ALLOWED_HOSTS="${PUBLIC_NAME}.${PUBLIC_DOMAIN},mcweb.${PUBLIC_SERVER}.${PUBLIC_DOMAIN}"
    if ! public_server; then
	ALLOWED_HOSTS="${ALLOWED_HOSTS},${APP_FQDN}"
    fi
    ;;
staging)
    # note mcweb-staging word order different from APP name
    STAGING=mcweb-staging
    # note: no global STAGING.PUBLIC_DOMAIN
    ALLOWED_HOSTS="${STAGING}.${PUBLIC_SERVER}.${PUBLIC_DOMAIN},${APP}.${PUBLIC_SERVER}.${PUBLIC_DOMAIN}"
    if ! public_server; then
	# allow non-public names if not getting letsencrypt cert
	ALLOWED_HOSTS="${ALLOWED_HOSTS},mcweb-staging.${FQDN},${APP_FQDN}"
    fi
    ;;
*)
    ALLOWED_HOSTS="$APP_FQDN"
    ;;
esac

# git remote for app; created by instance.sh, used by push.sh
DOKKU_GIT_REMOTE=${BASE_APP}_$INSTANCE

# using localhost on multiple servers with NFS home directory
# causes ssh known host pain, so use FQDN
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
# name of dokku config var set by instance.sh, checked by push.sh:
INSTANCE_HASH_VAR=INSTANCE_SH_GIT_HASH

# function and variable name are now misleading;
# return value is the concatenation of the short hashes of
# instance.sh AND this file!!
instance_sh_file_git_hash() {
    IHASH=$(git log -n1 --oneline --no-abbrev-commit --format='%h' $INSTANCE_SH)
    CHASH=$(git log -n1 --oneline --no-abbrev-commit --format='%h' $COMMON_SH)
    if [ -f $LOCAL_SH ]; then
	LHASH=$(git log -n1 --oneline --no-abbrev-commit --format='%h' $LOCAL_SH 2>/dev/null)
    fi
    echo $IHASH$CHASH$LHASH
}

# host server location of storage dirs
STORAGE_HOME=/var/lib/dokku/data/storage
