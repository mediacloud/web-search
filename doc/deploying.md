Deploying
=========

We deploy via containers on Ubuntu servers. In particular, we utilize [Dokku PaaS](https://dokku.com) to support simpler
configuration and deployment.

Setup
-----

The application requires a few pieces to exist and be able to communicate with each other:

### Postgres Database

This stores all the user, source, collection, and feed data.

```
dokku postgres:create mcweb-db
```

### Redis Cache

This caches query results to reduce overhead.

```
dokku redis:create mcweb-cache
```

### Webapp

This Django app serves up all the content and UI.

1. create the app: `dokku apps:create mcweb`
2. link to database: `dokku postgres:link mcweb-db mcweb`
3. link to cache: `dokku redis:link mcweb-cache mcweb`
4. setup config:
```
unset HITFILE  # don't save secretes to ~/.bash_history
dokku config:set --no-restart mcweb \
    DEBUG=False \
    DATABASE_URI=$(dokku postgres:info mcweb-db --dsn)
    CACHE_URL=$(dokku redis:info mcweb-cache --dsn)
    SECRET_KEY=SOME_RANDOM_STR \
    TWITTER_API_BEARER_TOKEN=YOUR_TOKEN \
    YOUTUBE_API_KEY=YOUR_YT_API_KEY
```
5. setup the domain: `dokku domains:add mcweb search.mediacloud.org`
6. on your local machine setup the remote: `git remote add mcweb-prod dokku@<SERVER>:mcweb`

Deploying
---------

1. update the version number in `settings.py` (ie. "0.1.1")
2. once we have a changelog, update the changelog to note changes/fixes
3. run all the tests to make sure they still pass: `python mcweb/manage.py test`
4. commit and tag the release with the version number (ie. "v0.1.1")
5. push the tag to the server: `git push mcweb-prod v0.1.1:main`
