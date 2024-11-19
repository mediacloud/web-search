# if you add new lines to this file, add them to the ps:scale command in dokku-scripts/push.sh!
web: bin/start-pgbouncer gunicorn --timeout 500 --pythonpath mcweb --bind 0.0.0.0:$PORT mcweb.wsgi
#
# run process_tasks workers in a single container under supervisord
supervisord: supervisord
