from __future__ import annotations

import datetime as dt
from collections.abc import Mapping, Sequence

import numpy as np

from .types import DailySeries


def _coerce_date(value: object) -> dt.date:
    if isinstance(value, dt.date) and not isinstance(value, dt.datetime):
        return value
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, str):
        return dt.date.fromisoformat(value[:10])
    raise TypeError(f"Unsupported date value: {value!r}")


def prepare_daily_series(
    series: Sequence[Mapping[str, object]],
    *,
    start_date: dt.date,
    end_date: dt.date,
) -> DailySeries:
    """
    Build a dense daily series with zero-fill and log1p transform.
    """
    if start_date > end_date:
        raise ValueError("start_date must be <= end_date")

    days = (end_date - start_date).days + 1
    dates = [start_date + dt.timedelta(days=i) for i in range(days)]
    counts_by_date: dict[dt.date, int] = {}

    for row in series:
        if "date" not in row:
            raise ValueError("Each row must include `date`.")
        raw_volume = row["volume"] if "volume" in row else row.get("count")
        if raw_volume is None:
            raise ValueError("Each row must include `volume` or `count`.")
        day = _coerce_date(row["date"])
        if start_date <= day <= end_date:
            counts_by_date[day] = counts_by_date.get(day, 0) + int(raw_volume)

    volume = np.asarray([counts_by_date.get(day, 0) for day in dates], dtype=float)
    log_volume = np.log1p(volume)
    return DailySeries(dates=dates, volume=volume, log_volume=log_volume)
