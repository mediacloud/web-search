# if you add new lines to this file, add them to the ps:scale command in dokku-scripts/push.sh!
web: bin/start-pgbouncer gunicorn --timeout 500 --pythonpath mcweb --bind 0.0.0.0:$PORT mcweb.wsgi
#
# workers for queues defined in mcweb/backend/util/task_queues.py:
# NOTE! names must end in "worker" for dokku-scripts/push.sh!!!
#
# original/default queue (now used for SYSTEM_SLOW):
worker: python mcweb/manage.py process_tasks
system-fast-worker: python mcweb/manage.py process_tasks --queue system-fast
admin-slow-worker: python mcweb/manage.py process_tasks --queue admin-slow
admin-fast-worker: python mcweb/manage.py process_tasks --queue admin-fast
user-slow-worker: python mcweb/manage.py process_tasks --queue user-slow
user-fast-worker: python mcweb/manage.py process_tasks --queue user-fast
