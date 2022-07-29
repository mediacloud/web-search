django-react-app
================

Installation
------------
1. Clone this repository
2. Python: `pip install -r requirements.txt` or `conda install --file requirements.txt` in root folder 'web-search'
3. Node: `npm install` in base folder (web-search)
4. Copy `.env.template` to `.env` and edit that one to enter in all your secret configuration variables in 'web-search' folder 
6. login to `http://localhost:8000/admin` to administer users and groups

Running Database: 
----------------
1. Database: 'python leadmanager/manage.py migrate' or cd into leadmanager and 'run python manage.py migrate'

Running
-------
1. Run the backend: `python leadmanager/manage.py runserver` or cd into leadmanager and 'run python manage.py runserver'
2. Run the frontend: `npm run dev`
3. Then visit http://127.0.0.1:8000/.

Releasing
---------
`npm run build` 

Helpeful Tips: 
---------
1. Two running terminals (1) django "backend" and (2) react "frontend"
2. Two running websites (1) http://localhost:8000/admin for administer users and groups and (2) http://localhost:8000/#/ for Media Cloud "Proof of Concept"
3. Redux Dev Tools (Google Chrome Extension) to see the live store 
