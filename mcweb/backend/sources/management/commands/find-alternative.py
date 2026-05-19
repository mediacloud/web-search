from typing import Any

from django.core.management.base import BaseCommand

from ...models import Collection, Source

class Command(BaseCommand):
    help = 'Search for alternative domain names'

    def handle(self, *args, **options):
        find_alternatives(options)

################################################################
# move to sources/ directory, call via tasks.py
# attach output CSVs to email?!
################################################################

import csv
import logging
import socket
import time
import urllib.parse

# PyPI
import requests
import time
import urllib3
from django.db.models import Count
from mcmetadata.requests_arcana import insecure_requests_session
from mcmetadata.urls import canonical_domain
from mcmetadata.webpages import MEDIA_CLOUD_USER_AGENT

def find_alternatives(options):
    a = AltCheck(options)
    try:
        a.find_alternatives()
    finally:
        a.finish()

TIMEOUT = 10
UA = MEDIA_CLOUD_USER_AGENT

BASE_COLS = "srcid,name,total,colls,last_story".split(",")
CHANGED_COLS = BASE_COLS + "new_name,new_id,new_total,new_colls,new_last".split(",")
FAILED_COLS = BASE_COLS + ["reason"]

CHANGED_CSV = "changed"
ERR_CSV = "err"

class AltCheck:
    def __init__(self, options: dict[str, Any]):
        self.options = options
        date = time.strftime("%F", time.gmtime())
        ext = f"-{date}.csv"
        self.chf = open(CHANGED_CSV + ext, "w")
        self.errf = open(ERR_CSV + ext, "w")

        self.chcsv = csv.DictWriter(self.chf, CHANGED_COLS)
        self.chcsv.writeheader()

        self.errcsv = csv.DictWriter(self.errf, FAILED_COLS)
        self.errcsv.writeheader()

    def finish(self):
        self.chf.close()
        self.errf.close()

    def base_cols(self, src):
        ret = {
            "srcid": src.id,
            "name": src.name,
            "total": src.stories_total,
            "colls": src.colls
        }
        if src.last_story:
            ret["last_story"] = src.last_story.strftime("%F")
        return ret

    def write_err(self, src, reason):
        row = self.base_cols(src)
        row["reason"] = reason
        self.errcsv.writerow(row)

    # returns domain name (old or new) or None
    def try_source(self, src: Source) -> str | None:
        # NOTE!!! doing initial DNS lookups with trailing dot (absolute domain
        # name) because angwin cluster resolv.conf includes
        # 'tarbell.mediacloud.org' and there is a *.tarbell.mediacloud.org
        # wildcard record that resolves locally to tarbell.angwin's address
        # (for dokku apps)!!

        # XXX use homepage (w/ inserted dot on hostname)???

        # prefer trying www.NAME
        try:
            domain = f"www.{src.name}."
            # gethostbyname is IPv4 only
            socket.getaddrinfo(domain, 443)
        except KeyboardInterrupt:
            raise
        except:
            domain = src.name + "."
            socket.getaddrinfo(domain, 443)

        # XXX wrap in "with"??
        req_sess = insecure_requests_session(UA) # fresh session/connection

        try:

            # NOTE!!! trailing dot to make absolute, avoiding finding
            # ANYTHING.mediacloud.org due to wildcard DNS record and
            # mediacloud.org in resolv.conf search path!
            resp = req_sess.head(f"http://{domain}/",
                                 allow_redirects=True,
                                 timeout=(TIMEOUT,TIMEOUT),
                                 verify=False
                                 )
            if not resp:
                # if 4xx, try again with proxy and/or browser UA string to diagnose??
                self.write_err(src, f"{resp.status_code} {resp.reason}")
                return None

            final_url = resp.url

            # XXX under try??
            final_dom = canonical_domain(final_url)

            u = urllib.parse.urlsplit(final_url)
            final_host = u.hostname
        except KeyboardInterrupt:
            raise
        except Exception as e:  # XXX
            self.write_err(src, str(e))
            # if read timeout try w/ proxy and/or browser UA?
            return None
        return final_dom

    def find_alternatives(self):
        root_logger = logging.getLogger('')
        root_logger.setLevel(logging.INFO)

        # XXX run in a subprocess??
        urllib3.disable_warnings()  # XXX will effect future tasks??

        q = Source.objects.filter(platform=Source.SourcePlatforms.ONLINE_NEWS,
                                  url_search_string__isnull=True,
                                  collections__monitored=True,
                                  stories_total__gt=0)\
                          .distinct()\
                          .annotate(colls=Count('collections'))\
                          .order_by('id')

        for src in q:               # XXX paginate!?
            if not src.stories_total: # filtered above!!
                continue

            if src.stories_per_week: # non-zero and non-null
                # still getting stories
                continue

            print(src.id, src.name)
            try:
                new_name = self.try_source(src)
                # XXX look up new domain, format and write changed row

                if new_name and src.name != new_name:
                    # here with final_dom latimes.com for http://www.signonsandiego.com/ ?!
                    # and seattletimes.com for seattlepi.something!!!
                    # Seeing https://accounts.google.com/ with signon URL????

                    row = self.base_cols(src)
                    row["new_name"] = new_name
                    try:
                        new = Source.objects\
                                    .annotate(colls=Count('collections'))\
                                    .get(name=new_name, url_search_string=None)
                        row["new_id"] = new.id
                        row["new_colls"] = new.colls
                        row["new_total"] = new.stories_total
                        if new.last_story:
                            row["new_last"] = new.last_story.strftime("%F")
                    except KeyboardInterrupt:
                        raise
                    except:
                        pass
                    self.chcsv.writerow(row)
            except KeyboardInterrupt:
                raise
            except Exception as e:
                self.write_err(src, str(e))

            if not src.homepage:
                self.write_err(src, "no homepage")
            else:
                try:
                    home_dom = canonical_domain(src.homepage)
                    if src.name != home_dom:
                        self.write_err(src, f"canonical_domain(homepage) {home_dom} != {src.name}")
                except KeyboardInterrupt:
                    raise
                except Exception as e:  # XXX be more specific (
                    self.write_err(src, f'canonical_domain(homepage): {e}')

            time.sleep(0.1)
