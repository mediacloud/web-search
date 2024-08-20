web: bin/start-pgbouncer gunicorn --timeout 500 --pythonpath mcweb --bind 0.0.0.0:8000 mcweb.wsgi
# can run multiple queues/workers w/ --queue "name":
worker: python mcweb/manage.py process_tasks
