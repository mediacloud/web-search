from __future__ import annotations

import dataclasses
import datetime as dt
from typing import Any

import numpy as np


@dataclasses.dataclass(frozen=True)
class DailySeries:
    dates: list[dt.date]
    volume: np.ndarray
    log_volume: np.ndarray


@dataclasses.dataclass(frozen=True)
class Segment:
    start_idx: int
    end_idx: int
    start: dt.date
    end: dt.date
    mean_volume: float
    mean_log_volume: float
    mode_volume: int | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "start_idx": self.start_idx,
            "end_idx": self.end_idx,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "mean_volume": self.mean_volume,
            "mean_log_volume": self.mean_log_volume,
            "mode_volume": self.mode_volume,
        }


@dataclasses.dataclass(frozen=True)
class PeltRunResult:
    start_date: dt.date
    end_date: dt.date
    model: str
    min_size: int
    penalty: float
    n_days: int
    segments: list[Segment]


@dataclasses.dataclass(frozen=True)
class RegimeChange:
    from_segment: int
    to_segment: int
    start: dt.date
    pct_change: float | None
    prev_median: float
    curr_median: float
    prev_mode: int | None
    curr_mode: int | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "from": self.from_segment,
            "to": self.to_segment,
            "start": self.start.isoformat(),
            "pct_change": self.pct_change,
            "prev_median": self.prev_median,
            "curr_median": self.curr_median,
            "prev_mode": self.prev_mode,
            "curr_mode": self.curr_mode,
        }
