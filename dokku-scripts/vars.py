# NOTE!! Written to be app independent!
# Move to a devops repo?
"""
generates VAR=VALUE arguments to pass to dokku config:set --encoded
(in the absense of a dokku config:import command)

Requirements:
1. Needs to be run outside dokku
2. Read shell style variable files, (ie; ".env" files)
   without limitations (handle # comments, and # in strings!)
3. Require the minimum number of packages installed
4. Written to be useful across apps
5. Can avoid overwriting existing config if unchanged

#2 is a pain, so dotenv is used, despite #3, installed in a private library
by config.sh
"""

import base64
import json
import sys

import dotenv

def usage(status: int) -> None:
    sys.stderr.write('''
Usage:
    vars.py [OPTIONS]

OPTIONS:
    -h | --help
        this output
    -C CURRENT_FILE | --current CURRENT_FILE
        read CURRENT_FILE as "dokku config:export --format=json APP" output
        (for values that don't need to be set)
    -F VARS_FILE | --file VARS_FILE
        merge VARS_FILE settings read with python "dotenv"
    -r | --raw
        output raw values for debug
        (default is base64 encoded for "dokku config:set app --encoded")
    -S VAR=VALUE | --set VAR=VALUE
        set a single VAR to VALUE
    -U VAR | --set VAR
        unset any previous value of VAR
''')
    sys.exit(status)

def main() -> None:
    # processing arguments ad-hoc: argparse requires
    # declaring an Action (sub)class to perform actions on the fly.

    b64_output = True
    args = list(sys.argv[1:])   # copy argv so not damaged
    vars = {}
    current = {}
    while args and args[0][0] == '-':
        option = args.pop(0)
        # if you add an option here, add to usage() above!!!
        # convention: single letter options are upper case if they take an argument
        match option:
            case "-h" | "--help":
                usage(0)
            case "-C" | "--current":
                if len(args) == 0:
                    usage(1)
                # read output of dokku config:export --format=json
                # only honors last file read
                with open(args.pop(0)) as f:
                    current = json.load(f)
            case "-F" | "--file":
                if len(args) == 0:
                    usage(1)
                vars.update(dotenv.dotenv_values(args.pop(0)))
            case "-r" | "--raw":
                b64_output = False
            case "-S" | "--set":
                if len(args) == 0:
                    usage(1)
                var, val = args.pop(0).split("=", 1)
                vars[var] = val
            case "-U" | "--unset":
                if len(args) == 0:
                    usage(1)
                del vars[args.pop(0)]
            case _:
                usage(1)
    # end while args...
    if len(args) > 0:
        usage(1)
    for var, value in vars.items():
        if var in current and current[var] == value:
            continue
        if b64_output:          # for dokku config:set --encoded ...
            # b64encode takes and returns bytes
            value = base64.b64encode(value.encode()).decode()
            print(f"{var}={value}")
        else:
            # not using = to make hard(er) to try to use!
            print(f"{var}: {value}")

if __name__ == '__main__':
    main()
