django-react-app
================

Installation
------------

1. Clone this repository
2. Python: `pip install -r requirements.txt` or `conda install --file requirements.txt` 
 a. in root folder (web-search)
3. Node: `npm install` in base folder 
 a. in root folder (web-search)
4. Copy `.env.template` to `.env` and edit that one to enter in all your secret configuration variables
 a. in 
5. `python manage.py createsuperuser` to create a Django superuser for administration
6. login to `http://localhost:8000/admin` to administer users and groups

Running Database: 
----------------
1. Database: 'python leadmanager/manage.py migrate'
Running
-------

1. Run the backend: `python leadmanager/manage.py runserver`
2. Run the frontend: `npm run dev`
3. Then visit http://127.0.0.1:8000/.

Releasing
---------

`npm run build` 