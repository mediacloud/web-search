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
