Run things outside Dokku, for casual developers
===============================================

NOTE! These scripts assume you have a Dokku app named $USER-mcweb on
the local host.  For quick tests (deploying a Dokku app takes a while).
Will set environment variables to access your PostgreSQL and Redis
services!

Uses mcweb/.env and vars.$USER for basic settings

* run-server.sh: expects mcweb/static mcweb/frontend/static directories (*)
* run-manage.sh: you supple the command and args
* run-queue.sh: expects one argument: {user,system,admin}-{fast,slow}

(*) copy from your Dokku container
