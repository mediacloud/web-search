Run things outside Dokku, for casual developers
===============================================

NOTE! These scripts assume you have a Dokku app named $USER-mcweb on
the local host.  For quick tests (deploying a Dokku app takes a while).
Will set environment variables to access your PostgreSQL and Redis
services!

Uses mcweb/.env and vars.$USER for basic settings

## run-server.sh: 

expects you to have run `copy-static.sh` (see below)

Will require setting _OUTSIDE_PORT port environment variable
if multiple developers doing this on the same server.

## copy-static.sh

copies static (including generated JS) content from Docker container
to allow running server.

## run-manage.sh

you supply the command and args to test a manage.py command

## run-manage-pdb.sh

starts manage.py under the Python debugger

## run-queue.sh

For testing and debugging background tasks.
Expects a queue name as an argument: {user,system,admin}-{fast,slow}
