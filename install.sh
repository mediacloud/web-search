#!/bin/bash
python mcweb/manage.py migrate

python mcweb/manage.py collectstatic --noinput