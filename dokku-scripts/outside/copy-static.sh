#!/bin/sh

# copy mcweb/static directory from running Dokku instance
# to "outside" for use with dokku/outside/run-server.sh
ssh dokku@$(hostname -a) enter ${USER}-mcweb web tar cf - mcweb/static | tar xvf -
