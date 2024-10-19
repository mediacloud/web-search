import argparse
import datetime as dt
import os

from pyairtable import Api
from pyairtable.formulas import match


# A utility to report new deployments to the central MEAG airtable record.
def create_deployment(
    codebase_name: str,
    deployment_name: str | None,
    environment: str,
    version_info: str,
    hardware_names: list[str],
) -> None:
    # The base id is not secret, but the api key is.
    api = Api(os.environ["AIRTABLE_API_KEY"])
    MEAG_BASE_ID = os.environ["MEAG_BASE_ID"]

    info = "Automatic deployment record"

    # Get codebases id:
    codebase_table = api.table(MEAG_BASE_ID, table_name="Software - Codebases")
    codebase_res = codebase_table.first(formula=match({"Name": codebase_name}))

    if codebase_res is None:
        # in the case where the value for codebase isn't in airtable, still record the name as free text.
        info += f" - Codebase: {codebase_name}"
        codebase = []
    else:
        codebase = [codebase_res["id"]]

    # Get hardware ids:
    hardware_table = api.table(MEAG_BASE_ID, table_name="Hardware - Angwin Cluster")

    hardware_res = [
        hardware_table.first(formula=match({"Name": hardware_name}))
        for hardware_name in hardware_names
    ]
    if None in hardware_res:
        # The names of the machines in the angwin cluster are all valid options,
        # but if a given value isn't among those names, put it in the message
        info += f" - Hardware: {hardware_names}"
        hardware = [h["id"] for h in hardware_res if h is not None]
    else:
        hardware = [h["id"] for h in hardware_res]  # type: ignore[index]

    deployment_table = api.table(MEAG_BASE_ID, table_name="Software - Deployments")

    if deployment_name is None:
        deployment_name = environment

    name = ":".join([codebase_name, deployment_name])

    allowed_envs = ["prod", "staging", "dev", "other"]
    if environment not in allowed_envs:
        info += f"-- env: {environment}"
        environment = "other"

    # Get the current time in UTC
    iso_timestamp = dt.datetime.utcnow().isoformat()

    resp = deployment_table.batch_upsert(
        [
            {
                "fields": {
                    "Name": name,
                    "Software - Codebases": codebase,
                    "Environment": environment,
                    "Hardware": hardware,
                    "Version": version_info,
                    "Deploy Time": iso_timestamp,
                    "Info": info,
                }
            }
        ],
        key_fields=["Name"],
    )
    print(resp)


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="A utility for updating an airtable deployment record"
    )

    parser.add_argument("--codebase", help="codebase being deployed")
    parser.add_argument("--name", help="additional deployment name")
    parser.add_argument(
        "--env",
        help="Formal environment name",
    )
    parser.add_argument("--version", help="A descriptive version string")
    parser.add_argument(
        "--hardware", nargs="+", help="The names of one or more machines"
    )

    args = parser.parse_args()

    create_deployment(args.codebase, args.name, args.env, args.version, args.hardware)