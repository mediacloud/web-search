# Design Thoughts for a "background task" framework in MC search tool v0.00001

The word "async" has specific meaning in Python, so not using it!

## Design Goals

1. Multi-purpose: should be trivial to use for additional purposes
2. User visible status/progress
3. Survivable -- tasks persist across reboots

Performing (some) regular periodic maintenance as tasks rather than
run via cron would make them visible to MC researchers who would
otherwise need to ask techies "when is the last time ... ran?"

## Possible extensions:

1. Checkpointable? -- REALLY long running tasks can resume at a checkpoint
2. Delayed tasks
3. Periodic tasks

## tables

### Background Tasks

table name: bgtasks??


column     | type     | description
-----------|----------|-------------------------
id         | bigint   | unique id from sequence
user       | string   | initiating user
type       | string   | job type (from a controlled set)
created_at | datetime | UTC time task created
status     | string   | 'waiting', 'active', 'completed'?
note       | string   | job description for display
function   | string   | "module.function" (or use type???)
parameters | string   | json encoded parameters
priority   | integer  | like Unix "nice": negative to run sooner
time_limit | integer  | time limit (in seconds? minutes??)

#### perhaps:

partition table by status:  have bgtasks_completed??

"period" column (interval) for regular maintenance tasks

"after" column (datetime) for delayed start

### Events

table name: bgevents

column     | type     | description
-----------|----------|------------------------
id         | bigint   | unique id from sequence
event      | string   | from limited set: started, completed, failed, progress?
bgtasks_id | bigint   | bgtasks table id (NOT a foreign key??)
created_at | datetime | UTC timestamp of event
note       | string   | human readable description of event

## Task environment

Unless we specify that tasks be writting as pure async/await-able functions,
tasks will run in separate processes.

Do we want a per-job log file (w/ timestamped stdout & stderr output)?

### API

#### Initial arguments for task functions:

1. dict w/ (subset of?) bgtask row columns (typed TaskDict?)
2. decoded bgtask.arguments??

#### API for tasks to report status:

0. bgtask.storage(task: TaskDict) -> string (path to directory for non-volatile storage)
1. bgtask.completed(task: TaskDict, success: bool, note: string, rerun_after: Optional[datetime])
2. bgtask.progress(task: TaskDict, note: string, args: Optional[JSON_encodable])\
	Optional args used to update bgtask.args column

Thoughts:

is "progress" enough/suitable for logging?

if we have task log files, have a bgtask.log call (take a logging.PRIORITY and a string)?

#### List of specifically allowed modules/functions

HERE: a list of web-search modules/functions that are safe to call.

Some may require explicit (re)initialization, others may
be automatically (re)initialized for the current process.

#### List of specifically disallowed modules/functions

HERE: a list of web-search modules/functions that are NOT safe to call.

### Queuing

Using a queuing system may not be needed, given the (currently) low
level of expected tasks.  It would likely suffice to have the
scheduler run tasks directly in sub-processes.  This provides
immediate direct feedback on process exit.
