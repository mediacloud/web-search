#!/bin/bash
curl -SL https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.bin -o lid.176.bin
mv lid.176.bin mcweb/backend/search/providers/language/
python mcweb/manage.py migrate
npm run build
python mcweb/manage.py collectstatic --noinput


