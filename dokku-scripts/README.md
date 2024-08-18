
## Scripts to assist creating and deploying web-search as a Dokku App

All scripts require the user has been set up to be a dokku
user using `sudo dokku ssh-keys:add .....`

NOTE!!! ONLY TESTED FOR "USER" INSTANCES!!!!

The directory, script names, branch and instance naming conventions
are the same as used by `rss-fetcher`.

### instance.sh

```
dokku-scripts/instance.sh create NAME
```

where name is `prod`, `staging` or a user name, creates a dokku app
and associated services.  For `prod` the app name is `mcweb`, otherwise
the app name is `NAME-mcweb`

```
dokku-scripts/instance.sh destroy NAME
```

You will be prompted to enter the app and service names to destroy.
this can be regarded as both a bug and a feature.

### clone-db.sh

Requires the user running the script have ssh access to user dokku on tarbell
(ie; `dokku ssh:keys add` has been run) and on the local server.

There is no check that the user running the script is the owner of the
database.


```
dokku-scripts/clone.db USERNAME-mcweb-db
```

Performs a full dump of the database of the production system on tarbell
and restores it to the `USERNAME-mcweb-db` postgres service.

If you do not clone the database, or you do, and you are not an
admin user in the production server, run:

```
sudo dokku enter pbudne-mcweb web /app/mcweb/manage.py createsuperuser
```

### push.sh

To configure an instance, and update its code run:

```
dokku-scripts/push.sh
````

If the currently checked out branch is `prod` or `staging` the
associated instance will be updated (requires git remote
`mcweb_BRANCH` be set up.

Otherwise, the logged in user's dokku instance will be used (using git
remote `mcweb_USERNAME` set up by `instance.sh create USERNAME`)

`push.sh` requires the current repo is "clean" (all changes checked
in), and pushed (to to the mediacloud repo for staging and production,
or to "origin" for user deployments).  

A tag will be applied and pushed (for staging and user deploys the tag
name is generated), for production, the tag name is vVERSION
(and the tag must not not already exist).
