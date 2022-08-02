Media Cloud Web Search and Source Management App
================================================

🚧 **under construction** 🚧

This is the new Media Cloud search application. It is intended to support online media research across platforms such
as online news, Twitter, Reddit, and other social media (via 3rd party APIs). We also use it to manage a large set of 
geographical and topical content collections, supporting reseearch into specific sub-corpora of content on those
platforms.

_Expected to launch publicly in early 2023_

Installation
------------
1. Clone this repository
2. Python: `pip install -r requirements.txt` or `conda install --file requirements.txt` 
3. Node: `npm install` in base folder 
4. Copy `mcweb/.env.template` to `mcweb/.env` and edit that one to enter in all your secret configuration variables
5. `python mcweb/manage.py migrate` to create all the database tables needed
6. `python mcweb/manage.py createsuperuser` to create a Django superuser for administration

Running
-------

1. Run the backend: `python mcweb/manage.py runserver`
2. Run the frontend: `npm run dev`
3. Then visit http://127.0.0.1:8000/.

Helpful Tips
------------

Other useful commands:
* import collection/source/feed data (from a folder on your computer): `python mcweb/manage.py importdata path/to/folder/with/data-files`
* login to `http://localhost:8000/admin` to administer users and groups
* Two running terminals (1) django "backend" and (2) react "frontend"
* Two running websites (1) http://localhost:8000/admin for administer users and groups and (2) http://localhost:8000/#/ for Media Cloud "Proof of Concept"
* Redux Dev Tools (Google Chrome Extension) to see the live store 

Releasing
---------
`npm run build` 

Helpeful Tips: 
---------
1. Two running terminals (1) django "backend" and (2) react "frontend"
2. Two running websites (1) http://localhost:8000/admin for administer users and groups and (2) http://localhost:8000/#/ for Media Cloud "Proof of Concept"
3. Redux Dev Tools (Google Chrome Extension) to see the live store 
