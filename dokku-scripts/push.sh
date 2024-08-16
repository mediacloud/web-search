#!/bin/sh

# Deploy code by pushing current branch to Dokkku app instance
# (development, staging, or production, depending on branch name)
# Phil Budne, August 2024
# (from rss-fetcher/dokku-scripts/push.sh Sept 2022)

SCRIPT_DIR=$(dirname $0)
FQDN=$(hostname -f)
BRANCH=$(git branch --show-current)

# DOES NOT NEED TO BE RUN AS ROOT!!!
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

    run_as_login_user() {
	$*
    }
fi

# get logged in user (even if su(do)ing)
# (lookup utmp entry for name of tty from stdio)
# will lose if run non-interactively via ssh (no utmp entry)
LOGIN_USER=$(who am i | awk '{ print $1 }')
if [ "x$LOGIN_USER" = x ]; then
    echo could not find login user 2>&1
    exit 1
fi

APP=mcweb
# Update instance.sh if you change this:
case $BRANCH in
prod) ;;
staging) APP=${APP}-staging;;
*) APP=${LOGIN_USER}-$APP;;
esac

# w/ app set; must agree w/ instance.sh
REDIS_SVC=${APP}-cache
PG_SVC=${APP}-db

# tmp files to clean up on exit
TMP=/tmp/mcweb-push$$
PRIVATE_CONF_DIR=$(pwd)/private-conf$$
trap "rm -rf $TMP $PRIVATE_CONF_DIR" 0

# hostname w/o any domain
HOSTNAME=$(hostname --short)

if ! dokku apps:exists $APP >/dev/null 2>&1; then
    echo "app $APP not found; run instance.sh?!" 1>&2
    exit 1
fi

if ! git diff --quiet; then
    echo 'local changes not checked in' 1>&2
    # XXX display diffs, or just dirty files??
    exit 1
fi

# XXX handle options for real!!
if [ "x$1" = x--force-push ]; then
    PUSH_FLAGS=--force
elif [ "x$1" != x ]; then
    echo "Unknown argument $1" 1>&2
    exit 1
fi

zzz() {
    echo $1 | tr 'A-Za-z' 'N-ZA-Mn-za-m'
}

ORIGIN="origin"

# PUSH_TAG_TO: other remotes to push tag to
PUSH_TAG_TO="$ORIGIN"

# DOKKU_GIT_REMOTE: Name of git remote for Dokku instance
git remote -v > $TMP

case "$BRANCH" in
prod|staging)
    # check if corresponding branch in mediacloud acct up to date

    # get remote for mediacloud account
    # ONLY match ssh remote, since will want to push tag.
    MCREMOTE=$(awk '/github\.com:mediacloud\// { print $1; exit }' $TMP)
    if [ "x$MCREMOTE" = x ]; then
	echo "could not find an ssh git remote for mediacloud org repo; add upstream?" 1>&2
	exit 1
    fi

    # check if MCREMOTE up to date.
    #    XXX sufficient if current commit part of remote branch???
    #
    #    http://codecook.io/git/214/check-if-specific-commit-is-on-remote
    #    "git branch -r --contains commit_sha" lists branches?
    #
    #    https://stackoverflow.com/questions/5549479/git-check-if-commit-xyz-in-remote-repo
    #    has "git log --cherry-pick --left-right <commitish> ^remote/branchname"

    if git diff --quiet $BRANCH $MCREMOTE/$BRANCH --; then
	echo "$MCREMOTE $BRANCH branch up to date."
    else
	# pushing to mediacloud repo should NOT be optional
	# for production or staging!!!
	echo "$MCREMOTE $BRANCH branch not up to date. run 'git push' first!!"
	exit 1
    fi
    # push tag back to JUST github mediacloud branch
    # (might be "origin", might not)
    PUSH_TAG_TO="$MCREMOTE"
    DOKKU_GIT_REMOTE=dokku_$BRANCH
    ;;
*)
    # here with some other branch; development.
    # check if origin (ie; user github fork) not up to date
    # XXX need "git fetch" ??
    if git diff --quiet origin/$BRANCH --; then
	echo "origin/$BRANCH up to date"
    else
	# have an option to override this??
	echo "origin/$BRANCH not up to date.  push!"
	exit 1
    fi

    DOKKU_GIT_REMOTE=mcweb_$LOGIN_USER
    ;;
esac

# name of deploy branch in DOKKU_GIT_REMOTE repo
DOKKU_GIT_BRANCH=main

if ! dokku apps:exists "$APP" >/dev/null 2>&1; then
    echo "app $APP not found" 1>&2
    exit 1
fi

TAB='	'
if ! grep "^$DOKKU_GIT_REMOTE$TAB" $TMP >/dev/null; then
    echo git remote $DOKKU_GIT_REMOTE not found 1>&2
    exit 1
fi

# before check for no changes!
echo checking INSTANCE_SH_GIT_HASH
INSTANCE_SH=$SCRIPT_DIR/instance.sh
INSTANCE_SH_CURR_GIT_HASH=$(dokku config:get $APP INSTANCE_SH_GIT_HASH)
INSTANCE_SH_FILE_GIT_HASH=$(git log -n1 --oneline --no-abbrev-commit --format='%H' $INSTANCE_SH)
if [ "x$INSTANCE_SH_CURR_GIT_HASH" != "x$INSTANCE_SH_FILE_GIT_HASH" ]; then
    echo $APP INSTANCE_SH_FILE_GIT_HASH $INSTANCE_SH_CURR_GIT_HASH 1>&2
    echo does not match $SCRIPT_DIR/instance.sh hash $INSTANCE_SH_FILE_GIT_HASH 1>&2
    echo re-run $INSTANCE_SH create NAME 1>&2
    exit 1
fi

git fetch $DOKKU_GIT_REMOTE
# have a --push-if-no-changes option?
if git diff --quiet $BRANCH $DOKKU_GIT_REMOTE/$DOKKU_GIT_BRANCH --; then
    echo no changes from $DOKKU_GIT_REMOTE 1>&2
    exit
fi

# XXX log all commits not in Dokku repo?? git log ${BRANCH}..$INSTANCE_SH_GIT_HASH/$DOKKU_GIT_BRANCH ???
echo "Last commit:"
git log -n1

# XXX display URL for DOKKU_GIT_REMOTE??
echo ''
echo -n "Push branch $BRANCH to $DOKKU_GIT_REMOTE dokku app $APP? [no] "
read CONFIRM
case "$CONFIRM" in
[yY]|[yY][eE][sS]) ;;
*) echo '[cancelled]'; exit;;
esac

if [ "x$BRANCH" = xprod ]; then
    # XXX check if pushed to github/mediacloud/PROJECT prod branch??
    # (for staging too?)

    TAG=v$(grep '^VERSION' mcweb/settings.py | sed -e 's/^.*= *//' -e 's/"//g' -e "s/'//g" -e 's/#.*//')
    echo "Found version number: $TAG"

    # NOTE! fgrep -x (-F -x) to match literal whole line (w/o regexps)
    if git tag | grep -F -x "$TAG" >/dev/null; then
	echo "found local tag $TAG: update mcweb.settings.VERSION?"
	exit 1
    fi

    # https://stackoverflow.com/questions/5549479/git-check-if-commit-xyz-in-remote-repo
    for REMOTE in origin $DOKKU_GIT_REMOTE $MCREMOTE; do
	if git fetch $REMOTE $TAG >/dev/null 2>&1; then
	    echo "found $REMOTE tag $TAG: update mcweb.settings.VERSION?"
	    exit 1
	fi
    done

    echo -n "This is production! Type YES to confirm: "
    read CONFIRM
    if [ "x$CONFIRM" != 'xYES' ]; then
       echo '[cancelled]'
       exit
    fi
else
    # XXX use staging or $USER instead of full $APP for brevity?
    TAG=$(date -u '+%F-%H-%M-%S')-$HOSTNAME-$APP
fi
# NOTE: push will complain if you (developer) switch branches
# (or your branch has been perturbed upstream, ie; by a force push)
# so add script option to enable --force to push to dokku git repo?

# NOTE! pushing tag first time causes mayhem (reported by Rahul at
# https://github.com/dokku/dokku/issues/5188)
#
# perhaps explained by https://dokku.com/docs/deployment/methods/git/
#	"As of 0.22.1, Dokku will also respect the first pushed branch
#	as the primary branch, and automatically set the deploy-branch
#	value at that time."
# (ISTR seeing refs/tags/..../refs/tags/....)

echo ''
# start shutdown while working on config...
#echo stopping processes...
#dokku ps:stop $APP

################################
echo checking dokku config...

# some of this from rss-fetcher/dokku-scripts/config.sh
# (only called from push.sh, so inlined here)

# call with VAR=VALUE ...
add_vars() {
    VARS="$VARS $*"
}

# maybe "grep -Ev '^(VAR1|VAR2)=' w/ vars NOT to honor from files?
FILTER=

case $BRANCH in
prod|staging)
    rm -rf $PRIVATE_CONF_DIR
    run_as_login_user mkdir $PRIVATE_CONF_DIR
    chmod go-rwx $PRIVATE_CONF_DIR
    cd $PRIVATE_CONF_DIR
    CONFIG_REPO_PREFIX=$(zzz tvg@tvguho.pbz:zrqvnpybhq)
    CONFIG_REPO_NAME=$(zzz jro-frnepu-pbasvt)
    echo cloning $CONFIG_REPO_NAME repo 1>&2
    if ! run_as_login_user "git clone $CONFIG_REPO_PREFIX/$CONFIG_REPO_NAME.git" >/dev/null 2>&1; then
	echo "FATAL: could not clone config repo" 1>&2
	exit 1
    fi
    PRIVATE_CONF_REPO=$PRIVATE_CONF_DIR/$CONFIG_REPO_NAME
    PRIVATE_CONF_FILE=$PRIVATE_CONF_REPO/web-search.${BRANCH}.sh
    cd ..
    ;;
*)
    # XXX ALLWAYS SET THESE (for prod & staging too)?? put in FILTER (see above)????
    PG_DSN=$(dokku postgres:info $PG_SVC --dsn)    # XXX 

    # NOTE!!! Dokku generates DATABASE_URL and REDIS_URL; just use them????!!!
    add_vars CACHE_URL=$(dokku redis:info $REDIS_SVC --dsn) \
	     DATABASE_URI=$PG_DSN \
	     DATABASE_URL=$PG_DSN
    
    # maybe check for env.$LOGIN_USER and set PRIVATE_CONF_FILE=env.$LOGIN_USER
    # and only use these if it doesn't exist?
    add_vars ALLOWED_HOSTS=${APP_FQDN},localhost \
	     NEWS_SEARCH_API_URL=http://ramos.angwin:8000/v1/ \
	     SECRET_KEY=BE_VEWY_VEWY_QUIET
    ;;
esac

if [ -f "$PRIVATE_CONF_FILE" ]; then
    add_vars $(sed 's/#.*$//' < $PRIVATE_CONF_FILE $FILTER)
fi

# call add_vars here for any stock/manual settings

CONFIG_OPTIONS=--no-restart

dokku config:show $APP | tail -n +2 | sed 's/: */=/' > $TMP
NEED=""
# loop for var=val (VV) pairs
for VV in $VARS; do
    # VE: var equals
    VE=$(echo $VV | sed 's/=.*$/=/')
    # find current value
    CURR=$(grep "^$VE" $TMP)
    if [ "x$VV" != "x$CURR" ]; then
	NEED="$NEED $VV"
    fi
done

if [ "x$NEED" != x ]; then
    echo setting dokku config: $NEED
exit
    dokku config:set $CONFIG_OPTIONS $APP $NEED
else
    echo no dokku config changes
fi

exit
# end config
################################################################

echo ''
echo adding local tag $TAG
git tag $TAG

echo ''
CURR_GIT_BRANCH=$(dokku git:report $APP | awk '/Git deploy branch:/ { print $4 }')
if [ "x$CURR_GIT_BRANCH" != "x$DOKKU_GIT_BRANCH" ]; then
    echo "Setting $APP deploy-branch to $DOKKU_GIT_BRANCH"
    dokku git:set $APP deploy-branch $DOKKU_GIT_BRANCH
fi

echo "pushing branch $BRANCH to $DOKKU_GIT_REMOTE $DOKKU_GIT_BRANCH"
if git push $DOKKU_GIT_REMOTE $BRANCH:$DOKKU_GIT_BRANCH; then
    echo OK
else
    STATUS=$?
    echo "$0: git push $DOKKU_GIT_REMOTE $BRANCH:$DOKKU_GIT_BRANCH failed with status $STATUS" 2>&1
    echo "deleting local tag $TAG"
    git tag -d $TAG >/dev/null 2>&1
    exit $STATUS
fi

echo "pushing tag $TAG to $DOKKU_GIT_REMOTE"
# suppress "WARNING: deploy did not complete, you must push to main."
git push $DOKKU_GIT_REMOTE $TAG >/dev/null 2>&1
echo "================"

# push tag to upstream repos
for REMOTE in $PUSH_TAG_TO; do
    echo pushing tag $TAG to $REMOTE
    git push $REMOTE $TAG
    echo "================"
done

if [ -d "$PRIVATE_CONF_REPO" ]; then
    echo "TODO: tag $PRIVATE_CONF_REPO and push!!!"
fi

# start fetcher/worker processes (only needed first time)
echo scaling up
PROCS="web=1 worker=1"
dokku ps:scale --skip-deploy $APP $PROCS
dokku ps:start $APP

echo "$(date '+%F %T') $APP $REMOTE $TAG" >> push.log
