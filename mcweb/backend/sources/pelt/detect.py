from __future__ import annotations

import datetime as dt

import numpy as np

from .types import PeltRunResult, Segment


def _segment_mode(volume: np.ndarray, *, start_idx: int, end_idx: int) -> int | None:
    values = np.asarray(volume[start_idx:end_idx], dtype=int)
    if values.size == 0:
        return None
    unique, counts = np.unique(values, return_counts=True)
    return int(unique[np.argmax(counts)])


def suggest_penalty(log_volume: np.ndarray, *, penalty_scale: float = 1.0) -> float:
    n = int(len(log_volume))
    if n <= 1:
        return 1.0
    var = float(np.var(log_volume))
    penalty = float(penalty_scale * np.log(max(n, 2)) * var)
    if not np.isfinite(penalty) or penalty <= 0:
        return 1.0
    return penalty


def segments_from_breakpoints(
    *,
    breakpoints: list[int],
    dates: list[dt.date],
    volume: np.ndarray,
    log_volume: np.ndarray,
) -> list[Segment]:
    n = len(volume)
    if len(dates) != n or len(log_volume) != n:
        raise ValueError("`dates`, `volume`, and `log_volume` must have the same length.")

    if not breakpoints:
        breakpoints = [n]
    if breakpoints[-1] != n:
        breakpoints = list(breakpoints) + [n]

    segments: list[Segment] = []
    prev = 0
    for bp in breakpoints:
        end_idx = int(bp)
        if end_idx <= prev:
            prev = end_idx
            continue
        seg_slice = slice(prev, end_idx)
        segments.append(
            Segment(
                start_idx=prev,
                end_idx=end_idx,
                start=dates[prev],
                end=dates[end_idx - 1],
                mean_volume=float(np.mean(volume[seg_slice])),
                mean_log_volume=float(np.mean(log_volume[seg_slice])),
                mode_volume=_segment_mode(volume, start_idx=prev, end_idx=end_idx),
            )
        )
        prev = end_idx
    return segments


def run_pelt(
    *,
    start_date: dt.date,
    end_date: dt.date,
    dates: list[dt.date],
    volume: np.ndarray,
    log_volume: np.ndarray,
    model: str = "l2",
    min_size: int = 7,
    penalty: float | str = "auto",
) -> PeltRunResult:
    if len(log_volume) == 0:
        raise ValueError("Cannot run PELT on an empty series.")

    penalty_value = suggest_penalty(log_volume) if str(penalty).lower() == "auto" else float(penalty)
    if penalty_value <= 0:
        raise ValueError("`penalty` must be > 0.")

    # Lazy import keeps module importable before dependency rollout.
    import ruptures as rpt

    log_volume_1d = np.asarray(log_volume, dtype=float).reshape(-1)
    volume_1d = np.asarray(volume, dtype=float).reshape(-1)
    algo = rpt.Pelt(model=model, min_size=int(min_size)).fit(log_volume_1d)
    breakpoints = algo.predict(pen=float(penalty_value))
    segments = segments_from_breakpoints(
        breakpoints=breakpoints,
        dates=dates,
        volume=volume_1d,
        log_volume=log_volume_1d,
    )
    return PeltRunResult(
        start_date=start_date,
        end_date=end_date,
        model=model,
        min_size=int(min_size),
        penalty=float(penalty_value),
        n_days=int(len(log_volume_1d)),
        segments=segments,
    )
