# awk script, run like:
# GOALS="web=5 worker=1"
# SCALE=$(dokku ps:scale $APP | awk -v "goals=$GOALS" -f scale.awk)
# if SCALE is non-empty, run dokku ps:scale $APP $SCALE
# NOTE! The ONLY thing that should go to stdout is proc=N ...

# extract current counts
/[a-z][a-z_-]*:  *[0-9][0-9]*/ {
    service = substr($1, 1, length($1)-1)
    val = $2
    curr[service] = val
}

# ignore anything else (default action is "print")
{ next }

END {
    # loop for var=val strings in "goals" var passed from command line
    n = split(goals, a, " ")
    for (i = 1; i <= n; ++i) {
	m = split(a[i], vv, "=")
	if (m == 2) {
	    service = vv[1]
	    goal = vv[2]
	    if (curr[service] != goal) {
		# output service=goal for ps:scale
		print a[i]
	    }
	}
    }
}
