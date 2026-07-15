"""
web-search deploy script using mc-deploy (in system-dev-ops repo).

mc-deploy needs to be installed in dev venv, but not in container!!

meant to replace shell scripts: push.sh, instance.sh, config.sh,
common.sh, dburl.sh, clone-db.sh, vars.py, scale.awk, etc.
"""

import os
import sys

from mc_deploy.base import ParserArgs
from mc_deploy.dokku import DokkuDBDjangoDeploy
from mc_deploy.django import SettingsVersionMixin


class WebSearchDeploy(SettingsVersionMixin,DokkuDBDjangoDeploy):
    # Much better to increase WEB_CONCURRENCY setting (gunicorn workers)
    # than number of web containers (parallel containers don't cooperate,
    # or report stats properly)!
    DOKKU_SCALE = {"web": 1, "supervisord": 1}
    PUBLIC_NAME = "search"      # w/o PUBLIC_DOMAIN

    # map of plugin name to service name suffix:
    DOKKU_SERVICES = {
        "postgres": "-db",
        "redis": "-cache",
        "storage": ""
    }

    INST_BASE = "mcweb"         # app base name
    PROJECT_REPO = "web-search"

    SETTINGS_FILE = "mcweb/settings.py" # for SettingsVersionMixin

    def settings_get_new(self, args: ParserArgs) -> None:
        """
        load project settings
        """
        super().settings_get_new(args)

        self.settings_add("STATSD_HOST", self.STATSD_HOST)
        # STATSD_PREFIX provided by base!

        # mcmetadata uses pylangid3 which uses numpy which uses
        # libopenblas for vector math, creating by default one worker
        # thread per virtual CPU, which sit and spin looking for work.
        # Use just one thread.  The same setting is used in
        # story-indexer (which actually does language identification),
        # with less CPU time used!
        self.settings_add("OPENBLAS_NUM_THREADS", "1")

        # from push.sh, config.sh:
        if self.is_prod_staging():
            files = ["web-search.prod.sh"]
            if self.is_staging():
                files.append("web-search.staging.sh") # overrides to prod
            self.settings_load_private_files(f"{self.PROJECT_REPO}-config",
                                             files)
        else:
            # load config file used outside Dokku, or template config
            # file to avoid multiple places with default dev
            # settings.
            for path in ["mcweb/.env", "mcweb/.env-template"]:
                if os.path.exists(path):
                    self.settings_load_file(path)
                    break
            else:
                self.fatal("did not find .env")

            # but remove static, external database & redis URLs
            # (dokku supplies those):
            self.settings_del("DATABASE_URL")
            self.settings_del("REDIS_URL")

            # Dokku only per-user settings:
            user_conf = f"vars.{self.user}"
            if not os.path.exists(user_conf):
                with open(user_conf, "w") as f:
                    print(f"creating {user_conf} for overrides")
                    f.write("# put config overrides in this file\n")
                    f.write("ADMIN_EMAIL='' # gets alerts, scrape errors\n")
                    # set system alert banner:
                    f.write(
                        f"""SYSTEM_ALERT="🚧 {self.user}'s dev instance 🚧"\n"""
                    )
            self.settings_load_file(user_conf)

        app = self.inst_name

        # ALLOWED_HOSTS config for Django.  For prod/staging could almost
        # CERTAINLY keep this in the static config!  Django doesn't pick up
        # ALLOWED_HOSTS from the environment by default.
        allowed: list[str] = []

        if self.is_prod():
            allowed.append(
                f"{app}.{self.dokku_host_short}.{self.PUBLIC_DOMAIN}"
            )
            allowed.append(
                f"{self.PUBLIC_NAME}.{self.PUBLIC_DOMAIN}"
            )
        else:
            # private/local name w/ internal domain:
            allowed.append(f"{app}.{self.dokku_host_fqdn}")
            if self.is_staging():
                base = self.get_inst_base() # without "staging-"
                # public name has -staging last
                allowed.append(
                    f"{base}-staging.{self.PUBLIC_HOST}.{self.PUBLIC_DOMAIN}"
                )
        self.debug("allowed", allowed)
        self.settings_add("ALLOWED_HOSTS", ",".join(allowed))

d = WebSearchDeploy()
sys.exit(d.run())
