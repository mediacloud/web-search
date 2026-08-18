"""
read requests.log for /api/search/requests

kinda big and ugly, so hiding it here!
"""

import json
import logging
import operator
import os
import time
import datetime as dt

# AIEEE! using private function and constant!!!
from mc_providers.onlinenews import _b64_decode_page_token, _SORT_KEY_SEP

from .utils import _for_media_cloud

logger = logging.getLogger(__name__)

def parse_date(s):
    try:
        return dt.date.fromisoformat(s)
    except:
        return dt.datetime.strptime(s, "%m/%d/%Y").date()

def parse_requests(fname: str, srcs: bool, ss_cache: dict, status: int | None) -> list[dict]:
    """
    srcs: expand sources
    ss_cache: cache of source results for collection/sources args
    """
    results = []
    logger.debug("parse_requests %s", fname)
    if os.path.exists(fname):
        with open(fname) as fin:
            for line in fin:
                j = json.loads(line.strip())

                path = j.get("path")
                if not path.startswith("/api/search/"):
                    continue
                path = path[12:] # trim /api/search/ prefix

                if status is not None:
                    code = j.get("response", {}).get("code", None)
                    if code != status:
                        continue

                # all web requests come in as queryObjects
                # more complex to process (mutiple queries)
                if j.get("has_session"):
                    continue

                user = j.get("user")
                ts = j.get("timestamp")
                duration = j.get("duration")

                h = j.get("headers", {})
                ua = h.get("User-Agent", "")
                # get original IP addr from CloudFlare or nginx headers:
                ip = h.get("Cf-Connecting-Ip", "") or h.get("X-Forwarded-For", "")

                rp = j.get("request_params")
                qo = rp.get("queryObject", None) # web-search only
                if qo:
                    continue

                if rp.get("qS"): # web-search only
                    # qs is JSON of list of query_objects
                    continue

                q = rp.get("q")
                if not q:       # no longer defaults to *
                    continue

                start = rp.get("start") or rp.get("start_date")
                end = rp.get("end") or rp.get("end_date")
                if not start or not end:
                    continue

                try:
                    start_dt = parse_date(start)
                    end_dt = parse_date(end)
                    days = (end_dt - start_dt).days + 1
                except:
                    continue

                row = {
                    "ts": ts[:19],
                    "user": user,
                    "ep": path,
                    "ms": int(duration * 1000),

                    # all of the following may appear more than once in browser queryString!!
                    "q": q,
                    "start": start,
                    "end": end,
                    "days": days,
                }

                if srcs:
                    cs_str = rp.get("cs", "")
                    ss_str = rp.get("ss", "")
                    key = f"{cs_str}~{ss_str}"
                    if key in ss_cache:
                        parents, children = ss_cache[key]
                    else:
                        cs = [int(x) for x in cs_str.split(",") if x]
                        ss = [int(x) for x in ss_str.split(",") if x]
                        # use query utility to get domains/url_search_strings!!
                        prov_params = _for_media_cloud(cs, ss, {})
                        parents = len(prov_params.get("domains", []))
                        uss_strings = prov_params.get("url_search_strings", {})
                        children = sum(len(ss_list)
                                       for ss_list in uss_strings.values())
                        ss_cache[key] = (parents, children)

                    row["par"] = parents
                    row["chld"] = children
                # end if sources
                pt = rp.get("pagination_token", "")
                if pt:
                    try:
                        row["pt"] = _b64_decode_page_token(pt).split(_SORT_KEY_SEP)
                    except:
                        pass
                results.append(row)
            # end for line in fin
        # end with open(fname) as fin
        logger.debug(" read %d entries", len(results))
    # end if path.exists
    return results

def read_requests(*, want: int = 100, srcs: bool = True, status: int | None = 200) -> list[dict]:
    ss_cache = {}               # (parents, children)

    # find path to current file
    for logs in [
            "data/logs/requests.log", # testing outside dokku
            "/app/data/logs/requests.log",
    ]:
        if os.path.exists(logs):
            break

    logger.info("logs %s", logs)

    rows = parse_requests(logs, srcs, ss_cache, status)

    # may have rolled over recently, be prepared
    # to read more files
    now = time.time()
    hours = 0          # hours back
    while len(rows) < want:
        # current hour unlikely to exist, previous may not either!
        p2 = logs + time.strftime(".%F_%H", time.gmtime(now-hours*60*60))
        hours += 1
        if os.path.exists(p2):
            rows.extend(parse_requests(p2, srcs, ss_cache, status))
        elif hours > 26:
            # missing files after the previous day
            # likely means we ran off the edge past kept files.
            break

    # sort in place, most recent first:
    rows.sort(key=operator.itemgetter("ts"), reverse=True)
    return rows
