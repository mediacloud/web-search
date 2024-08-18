# sourced by instance.sh & push.sh after APP is properly set

FQDN=$(hostname -f)
HOST=$(hostname -s)

dokku() {
    ssh dokku@$FQDN "$*"
}

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
