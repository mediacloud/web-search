web: gunicorn --timeout 500 --pythonpath mcweb --bind 0.0.0.0:$PORT mcweb.wsgi bin/start-pgbouncer
# can run multiple queues/workers w/ --queue "name":
worker: python mcweb/manage.py process_tasks
