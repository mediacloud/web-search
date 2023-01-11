#!/bin/bash

echo "Downloading fasttext model..."
curl -SL https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.bin -o lid.176.bin
mv lid.176.bin mcweb/backend/search/providers/language/
echo "  done downloading fasttext model"

echo "Running migrations and building javacsript"
python mcweb/manage.py migrate
npm run build
python mcweb/manage.py collectstatic --noinput
echo "  done with migrations and javascript build"
