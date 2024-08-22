# sourced by instance.sh & push.sh after INSTANCE set

BASE_APP=mcweb

case "$INSTANCE" in
prod)
    APP=$BASE_APP
    ;;
*)
    # staging or username
    APP=${INSTANCE}-${BASE_APP}
    ;;
esac

# TODO: use to generate set ALLOWED_HOSTS
case "$INSTANCE" in
prod)
    EXTRA_DOMAINS=search.mediacloud.org
    ;;
staging)
    EXTRA_DOMAINS=mcweb-staging.tarbell.mediacloud.org
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

# Internet visible domain
PUBLIC_DOMAIN=mediacloud.org

# Internet visible server
PUBLIC_SERVER=tarbell

public_server() {
    # replace with true if all servers public:
    test "$HOST" = "$PUBLIC_SERVER"
}

if public_server; then
    APP_FQDN=${APP}.${HOST}.${PUBLIC_DOMAIN}
else
    APP_FQDN=${APP}.${FQDN}
fi

# service names
PG_SVC=${APP}-db
REDIS_SVC=${APP}-cache
