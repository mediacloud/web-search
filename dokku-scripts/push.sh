#!/bin/sh

# Deploy code by pushing current branch to Dokkku app instance
# (development, staging, or production, depending on branch name)
# Phil Budne, August 2024
# (from rss-fetcher/dokku-scripts/push.sh Sept 2022)

SCRIPT_DIR=$(dirname $0)

# works when su'ed to another user or invoked via ssh
UNAME=$(whoami)

if [ "x$UNAME" = xroot ]; then
    echo "run as normal user" 1>&2
    exit 1
fi

for ARG in $*; do
    case "$ARG" in
    --force-push) PUSH_FLAGS=--force;; # force push code to dokku repo
    *) echo unknown argument $ARG; exit 1;;
    esac
done

BRANCH=$(git branch --show-current)

# Update instance.sh if you change how instances are named!
case $BRANCH in
prod|staging)
    INSTANCE=$BRANCH;;
*)
    INSTANCE=$UNAME;;
esac

# after INSTANCE set, sets APP, DOKKU_GIT_REMOTE, ..._SVC, APP_FQDN
. $SCRIPT_DIR/common.sh

# tmp files to clean up on exit
REMOTES=/tmp/mcweb-remotes$$

# dir will only exist if using private config:
PRIVATE_CONF_DIR=$(pwd)/private-conf$$
rm -rf $PRIVATE_CONF_DIR

trap "rm -rf $REMOTES $PRIVATE_CONF_DIR" 0

if ! dokku apps:exists $APP >/dev/null 2>&1; then
    echo "app $APP not found; run 'instance.sh create ${INSTANCE}'??" 1>&2
    exit 1
fi

if ! git diff --quiet; then
    echo 'local changes not checked in' 1>&2
    # XXX display diffs, or just dirty files??
    exit 1
fi

zzz() {
    echo $1 | tr 'A-Za-z' 'N-ZA-Mn-za-m'
}

ORIGIN="origin"

# PUSH_TAG_TO: other remotes to push tag to
PUSH_TAG_TO="$ORIGIN"

git remote -v > $REMOTES

case "$BRANCH" in
prod|staging)
    # check if corresponding branch in mediacloud acct up to date
    GIT_ORG='mediacloud'

    # get git remote for mediacloud account
    # ONLY match ssh remote, since will want to push tag.
    # XXX use common REPO_PREFIX?
    MCREMOTE=$(awk '/git@github\.com:'$GIT_ORG'\// { print $1; exit }' $REMOTES)
    if [ "x$MCREMOTE" = x ]; then
	echo "could not find an ssh git remote for $GIT_ORG org repo; add upstream?" 1>&2
	exit 1
    fi

    git fetch $MCREMOTE $BRANCH >/dev/null 2>&1

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
	echo "$MCREMOTE $BRANCH branch not up to date. run 'git push $MCREMOTE' first!!"
	exit 1
    fi
    # push tag back to JUST github mediacloud branch
    # (might be "origin", might not)
    PUSH_TAG_TO="$MCREMOTE"
    ;;
*)
    # here with some other branch; development.
    # check if origin (ie; user github fork) not up to date

    git fetch origin $BRANCH >/dev/null 2>&1

    if git diff --quiet origin/$BRANCH --; then
	echo "origin/$BRANCH up to date"
    else
	# have an option to override this??
	echo "origin/$BRANCH not up to date. run 'git push origin'" 1>&2
	exit 1
    fi
    ;;
esac

# name of deploy branch in DOKKU_GIT_REMOTE repo
DOKKU_GIT_BRANCH=main

if ! dokku apps:exists "$APP" >/dev/null 2>&1; then
    echo "app $APP not found" 1>&2
    exit 1
fi

TAB='	'
if ! grep "^$DOKKU_GIT_REMOTE$TAB" $REMOTES >/dev/null; then
    echo git remote $DOKKU_GIT_REMOTE not found 1>&2
    exit 1
fi

# before check for no changes! see if instance is up-to-date w/ instance.sh
echo checking $INSTANCE_HASH_VAR
INSTANCE_SH_FILE_GIT_HASH=$(instance_sh_file_git_hash) # run function
INSTANCE_SH_CURR_GIT_HASH=$(dokku config:get $APP $INSTANCE_HASH_VAR)
if [ "x$INSTANCE_SH_CURR_GIT_HASH" != "x$INSTANCE_SH_FILE_GIT_HASH" ]; then
    echo $APP INSTANCE_SH_FILE_GIT_HASH $INSTANCE_SH_CURR_GIT_HASH 1>&2
    echo does not match $SCRIPT_DIR/instance.sh hash $INSTANCE_SH_FILE_GIT_HASH 1>&2
    echo "re-run '$INSTANCE_SH create $INSTANCE' to update it" 1>&2
    exit 1
fi

git fetch $DOKKU_GIT_REMOTE
# have a --push-if-no-changes option?
if git diff --quiet $BRANCH $DOKKU_GIT_REMOTE/$DOKKU_GIT_BRANCH --; then
    echo no changes from $DOKKU_GIT_REMOTE 1>&2
    NO_CODE_CHANGE=1
fi

# XXX log all commits not in Dokku repo?? git log ${BRANCH}..$INSTANCE_SH_GIT_HASH/$DOKKU_GIT_BRANCH ???
echo "Last commit:"
git log -n1 | head -20

# XXX display URL for DOKKU_GIT_REMOTE??
echo ''
echo -n "Push branch $BRANCH to $DOKKU_GIT_REMOTE dokku app $APP? [no] "
read CONFIRM
case "$CONFIRM" in
[yY]|[yY][eE][sS]) ;;
*) echo '[cancelled]'; exit;;
esac

DATE_TIME=$(date -u '+%F-%H-%M-%S')
if [ "x$BRANCH" = xprod ]; then
    # XXX check if pushed to github/mediacloud/PROJECT prod branch??
    # (for staging too?)

    TAG=v$(grep '^VERSION' mcweb/settings.py | sed -e 's/^.*= *//' -e 's/"//g' -e "s/'//g" -e 's/#.*//')
    echo "Found version number: $TAG"

    CONFIG_TAG=${TAG}
    if [ "x$NO_CODE_CHANGE" = x ]; then
	# NOTE! fgrep -x (-F -x) to match literal whole line (w/o regexps)
	if git tag | grep -F -x "$TAG" >/dev/null; then
	    echo "found local tag $TAG: update mcweb.settings.VERSION?"
	    exit 1
	fi
    else
	# here with no code change, $TAG should already exist on code & config
	# new tag for config:
	CONFIG_TAG=${CONFIG_TAG}-${DATE_TIME}
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

    # XXX prompt for one line reason (to send to AIRTABLE)?
else
    TAG=${DATE_TIME}-${HOST}-${INSTANCE}
    CONFIG_TAG=${TAG}		# only used for staging
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

################################
echo making dokku config...

# fetching private repo could be made generic (moved to a devops repo)
# would need to supply script to create/augment per-user vars...
# XXX There should be an easy way to customize CONFIG_REPO_ORG!

case $BRANCH in
prod|staging)
    # always do fresh clone of config repo main branch
    rm -rf $PRIVATE_CONF_DIR
    mkdir $PRIVATE_CONF_DIR
    chmod go-rwx $PRIVATE_CONF_DIR
    cd $PRIVATE_CONF_DIR
    CONFIG_REPO_ORG=zrqvnpybhq
    CONFIG_REPO_PREFIX=$(zzz tvg@tvguho.pbz:$CONFIG_REPO_ORG)
    CONFIG_REPO_NAME=$(zzz jro-frnepu-pbasvt)
    echo cloning $CONFIG_REPO_NAME repo 1>&2
    if ! git clone $CONFIG_REPO_PREFIX/$CONFIG_REPO_NAME.git >/dev/null 2>&1; then
	echo "could not clone config repo" 1>&2
	exit 1
    fi
    PRIVATE_CONF_REPO=$PRIVATE_CONF_DIR/$CONFIG_REPO_NAME
    PRIVATE_CONF_FILE=$PRIVATE_CONF_REPO/web-search.${BRANCH}.sh
    # XXX verify APP_FQDN present in PRIVATE_CONF_FILE ALLOWED_HOSTS?

    tag_conf_repo() {
	(
	    cd $PRIVATE_CONF_REPO
	    echo tagging $CONFIG_REPO_NAME
	    git tag $CONFIG_TAG
	    echo pushing tag $CONFIG_TAG
	    # freshly cloned, so upstream == origin
	    git push origin $CONFIG_TAG
	)
    }
    ;;

*)
    ENV_TEMPLATE=mcweb/.env-template
    # create (or add to) per-user config settings.
    # maybe take entire ENV_TEMPLATE file,
    # but without ALLOWED_HOSTS, DATABASE_URL, REDIS_URL??

    USER_CONF=vars.$UNAME
    if [ ! -f $USER_CONF ]; then
	echo creating $USER_CONF
	echo '# mostly copied from mcweb/.env-template' > $USER_CONF
	echo '# (see it for comments)' >> $USER_CONF
	echo '# feel free to edit/add' >> $USER_CONF
    fi
    # pick up new vars from template as added.
    # always re-write ALLOWED_HOSTS, in case invoked on different servers
    for VAR in $(grep '^[A-Z]' $ENV_TEMPLATE | grep -Ev '^(DATABASE_URL|REDIS_URL)' | sed 's/=.*$//' | sort); do
	if ! grep -q "^$VAR=" $USER_CONF; then
	    echo "grabbing $VAR from $ENV_TEMPLATE"
	    grep "^$VAR=" $ENV_TEMPLATE | sed "s/^ALLOWED_HOSTS=.*$/ALLOWED_HOSTS='$APP_FQDN'/" >> $USER_CONF
	fi
    done

    # XXX require ADMIN_EMAIL to be present??

    PRIVATE_CONF_FILE=$USER_CONF
    ;;
esac

# start shutdown while working on config...
#echo stopping processes...
#dokku ps:stop $APP

echo configuring app...
$SCRIPT_DIR/config.sh $INSTANCE $PRIVATE_CONF_FILE

CONFIG_STATUS=$?
case $CONFIG_STATUS in
$CONFIG_STATUS_CHANGED)
    if [ "x$NO_CODE_CHANGE" != x ]; then
	echo config updated, but no code change: need to restart app 1>&2

	if [ -d $PRIVATE_CONF_DIR ]; then
	    tag_conf_repo
	fi
	# XXX restart app?
	exit 1
    fi
    ;;
$CONFIG_STATUS_ERROR)
    echo config script failed 1>&2
    exit 1
    ;;
$CONFIG_STATUS_NOCHANGE)
    if [ "x$NO_CODE_CHANGE" != x ]; then
	echo no change to code or config 1>&2
	exit 1
    fi
    ;;
*)
    echo $0: unknown CONFIG_STATUS $CONFIG_STATUS 1>&2
    exit 1
esac

echo ''
echo adding local tag $TAG
git tag $TAG

echo ''
CURR_GIT_BRANCH=$(dokku git:report $APP | awk '/Git deploy branch:/ { print $4 }')
# maybe accept old values for existing deployments?
if [ "x$CURR_GIT_BRANCH" != "x$DOKKU_GIT_BRANCH" ]; then
    echo "Setting $APP deploy-branch to $DOKKU_GIT_BRANCH"
    dokku git:set $APP deploy-branch $DOKKU_GIT_BRANCH
fi

echo "pushing branch $BRANCH to $DOKKU_GIT_REMOTE $DOKKU_GIT_BRANCH"
if git push $PUSH_FLAGS $DOKKU_GIT_REMOTE $BRANCH:$DOKKU_GIT_BRANCH; then
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

# for prod/staging: tag config repo and push tag
if [ -d "$PRIVATE_CONF_REPO" ]; then
    tag_conf_repo
fi

# start worker process(es); first time only
# if additional kinds of workers do "for nn in NAME=NUMBER; do ..... "
if ! dokku ps:report $APP | grep -q 'Status worker 1:'; then
    echo starting worker process
    dokku ps:scale --skip-deploy $APP worker=1
fi
#dokku ps:start $APP

echo "$(date '+%F %T') $APP $REMOTE $TAG" >> push.log
