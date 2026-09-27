"""
read requests.log for /api/search/requests

kinda big and ugly, so hiding it here!
"""

import datetime as dt
import html                     # temp? for make_table
import json
import logging
import operator
import os
import time
from typing import TypeAlias

# AIEEE! using private function and constant!!!
from mc_providers.onlinenews import _b64_decode_page_token, _SORT_KEY_SEP

# mcweb/util/
from util.exceptions import UserValueError

# mcweb/backend/search/
from .utils import _for_media_cloud

SrcCounts: TypeAlias = tuple[int, int] # (parents, children)
SrcCountCache: TypeAlias = dict[str, SrcCounts]

logger = logging.getLogger(__name__)

def parse_date(s):
    try:
        return dt.date.fromisoformat(s)
    except:
        # sent by web-search
        return dt.datetime.strptime(s, "%m/%d/%Y").date()

def parse_requests(fname: str, srcs: bool, sc_cache: SrcCountCache, status: int | None) -> list[dict]:
    """
    srcs: expand sources
    sc_cache: cache of source results for collection/sources args
    """
    def check_cache(*, cs_str: str | None = None,
                    ss_str: str | None = None,
                    cs: list[int] | None = None,
                    ss: list[int] | None = None) -> SrcCounts:
        cs_strs = ss_strs = None
        if cs is not None and cs_str is None:
            cs_strs = [str(x) for x in cs]
            cs_str = ",".join(cs_strs)

        if ss is not None and ss_str is None:
            ss_strs = [str(x) for x in ss]
            ss_str = ",".join(ss_strs)

        key = f"{cs_str}~{ss_str}"
        if key in sc_cache:
            return sc_cache[key]

        if cs_strs is None:
            assert isinstance(cs_str, str)
            if cs_str:
                cs_strs = cs_str.split(",")
            else:
                cs_strs = []
        if ss_strs is None:
            assert isinstance(ss_str, str)
            if ss_str:
                ss_strs = ss_str.split(",")
            else:
                ss_strs = []

        # use query utility to get domains/url_search_strings!!
        prov_params = _for_media_cloud(cs_strs, ss_strs, {})
        parents = len(prov_params.get("domains", []))
        uss_strings = prov_params.get("url_search_strings", {})
        children = sum(len(ss_list)
                       for ss_list in uss_strings.values())
        sc_cache[key] = pc = (parents, children)
        return pc

    def pqo(qo):
        """
        parse query object
        """
        start_dt = parse_date(qo["startDate"])
        end_dt = parse_date(qo["endDate"])
        days = (end_dt - start_dt).days + 1

        ret = {
            "q": qo["query"],
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat(),
            "days": days
        }
        if srcs:
            cs = rp.get("collections", [])
            ss = rp.get("sources", [])
            ret["par"], ret["chld"] = check_cache(cs=cs, ss=ss)
        return ret

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

                user = j.get("user")
                ts = j.get("timestamp")
                duration = j.get("duration")

                if j.get("has_session"):
                    s = "*"
                else:
                    s = ""

                row = {
                    "ts": ts[:19],
                    "user": user,
                    "ep": path,
                    "ms": int(duration * 1000),
                    "s": s
                }

                # get original IP addr from CloudFlare or nginx headers:
                #h = j.get("headers", {})
                #ip = h.get("Cf-Connecting-Ip", "") or h.get("X-Forwarded-For", "")

                rp = j.get("request_params")
                if (qo := rp.get("queryObject", None)):
                    try:
                        qs = [pqo(qo)]
                    except UserValueError:
                        continue
                elif (qS := rp.get("qS")):
                    # argument is jsonified list of queryObjects
                    try:
                        qs = [pqo(qo) for qo in json.loads(qS)]
                    except UserValueError:
                        continue
                elif (q := rp.get("q")):
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

                    q1 = {
                        "q": q,
                        "start": start,
                        "end": end,
                        "days": days,
                    }

                    if srcs:
                        cs_str = rp.get("cs", "")
                        ss_str = rp.get("ss", "")
                        try:
                            q1["par"], q1["chld"] = check_cache(cs_str=cs_str, ss_str=ss_str)
                        except UserValueError:
                            continue
                    # end if sources
                    qs = [q1]
                    # end regular query
                else:
                    continue

                row["qs"] = qs

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
    sc_cache: SrcCountCache = {}

    # find path to current file
    for logs in [
            "data/logs/requests.log", # testing outside dokku
            "/app/data/logs/requests.log",
    ]:
        if os.path.exists(logs):
            break

    logger.info("logs %s", logs)

    rows = parse_requests(logs, srcs, sc_cache, status)

    # may have rolled over recently, be prepared
    # to read more files
    now = time.time()
    hours = 0          # hours back
    while len(rows) < want:
        # current hour unlikely to exist, previous may not either!
        p2 = logs + time.strftime(".%F_%H", time.gmtime(now-hours*60*60))
        hours += 1
        if os.path.exists(p2):
            rows.extend(parse_requests(p2, srcs, sc_cache, status))
        elif hours > 26:
            # missing files after the previous day
            # likely means we ran off the edge past kept files.
            break

    # sort in place, most recent first:
    rows.sort(key=operator.itemgetter("ts"), reverse=True)
    return rows

def make_table(rows: list[dict]) -> str:
    """
    return an HTML table for parsed requests
    """
    title = "recent API requests"
    lines = [
        "<html>",
        f"<head><title>{title}</title></head>",
        "<body>",
        f"<h2>{title}</h2>",
        "<table border=1>"
    ]
    if rows:
        keys = list(rows[0].keys())
        header = "".join(f"<th>{key}</th>" for key in
                         "s,ts,user,ep,ms,q,start,end,days,par,chld,pr".split(","))

        lines.append(f"<tr>{header}</tr>")
        for row in rows:
            def _fetch(d, key) -> str:
                v = d.get(key, None)
                if key in ("ts", "pt"):
                    if key == "pt":
                        if v is None:
                            return ""
                        # first list item is datetime w/ microseconds
                        v = v[0][:19] # just yyyy-mm-ddThh:mm:ss
                    # replace T with space so can be line break
                    return v.replace("T", " ")
                else:
                    return str(v)

            def td(d, k, r=None) -> str:
                s = _fetch(d, k)
                if r and r > 1:
                    span = f" rowspan={r}"
                else:
                    span = ""
                return f"<td{span}>{html.escape(s)}</td>"
            qs = row["qs"]
            r = len(qs)
            q0 = qs.pop(0)
            # ts,user,ep,ms,q,start,end,days,par,chld,pt".split(","))
            line = "".join([
                td(row, "s", r),
                td(row, "ts", r),
                td(row, "user", r),
                td(row, "ep", r),
                td(row, "ms", r),
                td(q0, "q"),
                td(q0, "start"),
                td(q0, "end"),
                td(q0, "days"),
                td(q0, "par"),
                td(q0, "chld"),
                td(row, "pt", r)
            ])
            lines.append(f"<tr>{line}</tr>")
            for q in qs:
                line = "".join([
                    td(q, "q"),
                    td(q, "start"),
                    td(q, "end"),
                    td(q, "days"),
                    td(q, "par"),
                    td(q, "chld")
                ])
                lines.append(f"<tr>{line}</tr>")
    lines.append("</table>")
    lines.append("</body>")
    lines.append("</html>")
    return "\n".join(lines)
