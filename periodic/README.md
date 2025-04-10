Subdirectories of the periodic directory are run by the manage.py
"periodic" command from crontab files created by
dokku-scripts/crontab.sh

Scripts in each directory should be:
* Named nnn.short-descr, where nnn is a three digit number
  that controls the order scripts are run in.
* Be executable /bin/sh scripts (start with "#!/bin/sh")

Suggestions:
* At first make nnn multiples of 100
* When adding scripts between two others, make nnn a multiple of 10
  (use 50 between two multiples of 100)
* If adding a script between two multiples of 10, use a multiple of 5
* Only use multiples of 1 between two multiples of 5.

Scripts are run with a lock held, so there can only be one process
executing that script at any time.  Having multiple scripts invoke the
same command will defeat this, and is a bad idea!
