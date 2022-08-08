Making Database Schema Changes
==============================

We use Django to manage database schema changes in code. It includes an ORM layer that can detect changes to the object
and generate a migration to change the database, effectively creating a versioned schema.

1. Change the app's `models.py` file to add/remove columns and tables as desired.
2. Run `python mcweb/manage.py makemigrations` to generate a new migration file.
3. Run `python mcweb/manage.py migrate` to apply your migrations to the database.

You can read [more detailed documentation on Django Migrations](https://docs.djangoproject.com/en/4.0/topics/migrations/). 
