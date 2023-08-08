Django Management Commands
=========

Alert System
---------
This command is intended to run the 'Source Alert System' found in `mcweb/backend/sources/tasks.py`. The idea is to run a list of collections we care about, get all those sources and query the rss fetcher to get their monthly fetched story counts. From there we check the counts for various statistics and `alert` when a source is not fetching at usual capacity.

### To run Alert System
* `python mcweb/manage.py source-alert-system ` in production terminal
- will print "Schedule the source alert system to run" when command has been successfully run
- the underlying command is a django background task (status can be seen in your profile)
  - background tasks on production are automatically run by a worker
  - currently task is manually assigned to `Evan-Leon`, can be reassigned in mcweb/backend/sources/tasks.py `run_alert_system`
* When alert system is done it will send emails to list in mcweb/util/send_emails.py `send_alert_email`

Update Stories Per Week
---------
This command is intended to update all sources in the rss fetcher with an estimated weekly story count. Source id and 30-day-moving average tuple ex. (3, 24.5), are received from rss fetcher, single day average is multiplied by 7 and rounded, then saved to the source. 

### To run Update Stories Per Week
* `python mcweb/manage.py update-stories-per-week` in production terminal 
- will print "Update the stories-per-week for every media source in rss fetcher" when command has been run
- will trigger background task to run
- currently task is manually assigned to `Evan-Leon`, can be reassigned in mcweb/backend/sources/tasks.py `run_alert_system`

### To run Import Data
* `python mcweb/manage.py importdata` in production terminal 
- will print out the status of the wiping and importing of all collections, sources, associations
between them, feeds, and reset postgres sequences.
- This process is required since the Sources and Collections models have changed, causing issues
with the `importdata` command. 
- Step 1: Create a new branch `git checkout -b [any-branch-name]`
- Step 2: Go into mcweb.backend.sources.models
- Step 3: In the `Collections` model alter
  From: 
    `public = models.BooleanField(default=True, null=False, blank=False)`
    `featured = models.BooleanField(default=False, null=False, blank=False)`
  To:
    `public = models.BooleanField(default=True, null=True, blank=True)`
    `featured = models.BooleanField(default=False, null=True, blank=True)`

- Step 4: In the `Sources` model alter
  From: 
    `alerted = models.BooleanField(default=False)`
  To: 
    `alerted = models.BooleanField(default=False, blank=True, null=True)`

- Step 5: From the root folder run these commands:

`python mcweb/manage.py makemigrations` for creating new migrations based on the changes you have made to your models.

`python mcweb/manage.py migrate` to apply the migrations

`python mcweb/manage.py importdata` 

- Step 6: In the `Collections` model revert
  From: 
    `public = models.BooleanField(default=True, null=True, blank=True)`
    `featured = models.BooleanField(default=False, null=True, blank=True)`
   To:
     `public = models.BooleanField(default=True, null=False, blank=False)`
    `featured = models.BooleanField(default=False, null=False, blank=False)`

- Step 7: In the `Sources` model revert
  From: 
    `alerted = models.BooleanField(default=False, blank=True, null=True)`
  To: 
    `alerted = models.BooleanField(default=False)`

- Step 8: From the root folder run these commands:
`python mcweb/manage.py makemigrations` for creating new migrations based on the changes you have made to your models.

`python mcweb/manage.py migrate` to apply the migrations

- Step 9: Delete the new migration files created in mcweb.backend.sources.migrations (there should be 2 for each model change)

- Step 10: There should be no new changes (git status) and you can go back to `main`