#!/bin/bash
python mcweb/manage.py migrate
npm run build
python mcweb/manage.py collectstatic --noinput

