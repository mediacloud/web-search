# sourced by dokku-scripts/outside/run-THINGS.sh; establish environment

# using _NAME to avoid collisions with actual config

if [ "x$_BASE_DIR" = x ]; then
    echo _BASE_DIR not set 1>&2
    exit 1
fi
_WEB_SEARCH=$_BASE_DIR/../..
_VENV_DIR=$_WEB_SEARCH/venv
_VENV_BIN=$_VENV_DIR/bin
_PYTHON=$_VENV_BIN/python

if [ ! -x "$_PYTHON" ]; then
    echo $_PYTHON not found 1>&2
fi

_HOSTNAME=$(hostname -f)

dburl() {
    local SVC=$1
    ssh dokku@$_HOSTNAME postgres:info $SVC | awk "
    /Dsn:/ { dsn = \$2 }
    /Internal ip:/ { ip = \$3
	print gensub(/^postgres:/, \"postgresql:\", 1, 
	    gensub(/dokku-postgres-$SVC/, ip, 1, dsn))
	exit 0
    }"
}

redisurl() {
    local SVC=$1
    ssh dokku@$_HOSTNAME redis:info $SVC | awk "
    /Dsn:/ { dsn = \$2 }
    /Internal ip:/ { ip = \$3
	print gensub(/dokku-redis-$SVC/, ip, 1, dsn)
	exit 0
    }"
}

_FILES=$_WEB_SEARCH/mcweb/.env
. $_FILES
if [ -f vars.$USER ]; then
    _FILES="$FILES vars.$USER"
    . $_WEB_SEARCH/vars.$USER
fi


# export everything in all the config files:
export $(grep -h '^[A-Z]' $_FILES | sed 's/=.*$//')

# NOTE!  Copied mcweb/static mcweb/frontend/static directory trees
# from a container!!

export ALLOWED_HOSTS=${USER}-mcweb.$_HOSTNAME
export DATABASE_URL=$(dburl ${USER}-mcweb-db)
export DEBUG=True
export OPENBLAS_NUM_THREADS=1
export REDIS_URL=$(redisurl ${USER}-mcweb-cache)
export SYSTEM_ALERT="🚨 $USER hand-run instance 🚨"

# XXX check DATABASE_URL and REDIS_URL??

cd $_WEB_SEARCH
