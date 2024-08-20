
## Scripts to assist creating and deploying web-search as a Dokku App

These scripts are intended to allow multiple instances of
the app to run on a single Dokku server.

NOTE!!! ONLY TESTED FOR "USER" INSTANCES!!!!

All scripts require that the user has been set up to be a dokku ssh
user using `sudo dokku ssh-keys:add .....`

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

### accessing an instance

To access an instance running on a server that is not directly visible
to the Internet:

add:

```
127.0.0.1	 USERNAME-mcweb.DOKKU-SERVER.LOCALDOMAIN
```

to the **END** of the local /etc/hosts file.
(this may be `C:\Windows\System32\Drivers\etc\hosts` on a Windoze
system.  Your mileage may vary).

Where DOKKU-SERVER.LOCALDOMAIN is the name output by `hostname -f` run on
the dokku app server system.

Then ssh to an Internet (or VPN visible) server that can access
the server with the dokku instance using:

```
ssh VISIBLESERVER -L LOCALPORT:DOKKU-SERVER.LOCALDOMAIN:80
```

And in a browser window open
`http://USERNAME-mcweb.DOKKU-SERVER.LOCALDOMAIN:LOCALPORT`

where LOCALPORT is an arbitrary, easy to remember port number greater
than or equal to 1024 (I use 8080).

### bonus knowledge

A handy bit of ssh wizardry is that you can use VISIBLESERVER to
forward your ssh connection to a hidden server by putting the following
in your `.ssh/config` file:

```
host VISIBLE-SERVER
  User USERNAME_ON_VISIBLE-SERVER
  Hostname FULL_DOMAIN_NAME_OF_VISIBLE-SERVER

host *.HIDDENDOMAIN HIDDEN-SERVER1 HIDDEN-SERVER2 HIDDEN-SERVER3
  User USERNAME_ON_HIDDEN-SERVERn
  ProxyJump VISIBLE-SERVER
```

Then `ssh ANYSERVER.HIDDENDOMAIN` or `ssh HIDDEN-SERVERn`
should work.

NOTE: HIDDEN-SERVERn need not be fully qualified, so long
as the name is meaningfull on VISIBLE-SERVER.

You can also put the port forwarding in a `.ssh/config` file:

```
host HIDDEN8080
  User USER_ON_HIDDEN
  ProxyJump VISIBLE
  Hostname HIDDEN
  LocalForward 8080 127.0.0.1:80
```

In any case, you will only be able to open one ssh session with port
forwarding for a given local port.
