from __future__ import annotations

import numpy as np

from .types import RegimeChange, Segment


def _segment_median(volume: np.ndarray, segment: Segment) -> float:
    values = np.asarray(volume[segment.start_idx:segment.end_idx], dtype=float)
    if values.size == 0:
        return 0.0
    return float(np.median(values))


def _segment_mode(volume: np.ndarray, segment: Segment) -> int | None:
    if segment.mode_volume is not None:
        return segment.mode_volume
    values = np.asarray(volume[segment.start_idx:segment.end_idx], dtype=int)
    if values.size == 0:
        return None
    unique, counts = np.unique(values, return_counts=True)
    return int(unique[np.argmax(counts)])


def summarize_regime_changes(*, segments: list[Segment], volume: np.ndarray) -> list[RegimeChange]:
    """
    Build a neutral regime-transition summary for downstream alert policies.
    """
    if len(segments) < 2:
        return []

    changes: list[RegimeChange] = []
    for i in range(1, len(segments)):
        prev = segments[i - 1]
        curr = segments[i]
        prev_median = _segment_median(volume, prev)
        curr_median = _segment_median(volume, curr)
        if prev_median == 0:
            pct_change = None
        else:
            pct_change = ((curr_median - prev_median) / prev_median) * 100.0

        changes.append(
            RegimeChange(
                from_segment=i - 1,
                to_segment=i,
                start=curr.start,
                pct_change=pct_change,
                prev_median=prev_median,
                curr_median=curr_median,
                prev_mode=_segment_mode(volume, prev),
                curr_mode=_segment_mode(volume, curr),
            )
        )
    return changes
