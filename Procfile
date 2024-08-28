# if you add new lines to this file, add them to the ps:scale command in dokku-scripts/push.sh!
web: bin/start-pgbouncer gunicorn --timeout 500 --pythonpath mcweb --bind 0.0.0.0:$PORT mcweb.wsgi
# can run multiple queues/workers w/ --queue "name":
worker: python mcweb/manage.py process_tasks
