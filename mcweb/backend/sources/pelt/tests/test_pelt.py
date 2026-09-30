"""
Unit tests for the backend/sources/pelt package: pure numpy/dataclass
changepoint-detection code backing the alert system (alerts.py). Zero
DB/network dependency, so fully unit-testable, but had no coverage despite
real logic: date coercion, zero-fill, divide-by-zero guards, and
breakpoint->segment conversion -- exactly the kind of numpy-heavy code
worth pinning down before a Python 3.12 upgrade.
"""

import datetime as dt

import numpy as np
from django.test import SimpleTestCase

from ..detect import run_pelt
from ..preprocess import prepare_daily_series
from ..summarize import summarize_regime_changes
from ..types import Segment


def _seg(start_idx, end_idx, *, start, end, mean_volume=0.0, mean_log_volume=0.0, mode_volume=None):
    return Segment(
        start_idx=start_idx, end_idx=end_idx, start=start, end=end,
        mean_volume=mean_volume, mean_log_volume=mean_log_volume, mode_volume=mode_volume)


class PrepareDailySeriesTest(SimpleTestCase):
    def test_dense_fill_with_zeros_for_missing_days(self):
        series = [{"date": "2024-01-01", "volume": 5}, {"date": "2024-01-03", "volume": 7}]

        result = prepare_daily_series(series, start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 3))

        self.assertEqual(result.dates, [dt.date(2024, 1, 1), dt.date(2024, 1, 2), dt.date(2024, 1, 3)])
        np.testing.assert_array_equal(result.volume, [5.0, 0.0, 7.0])
        np.testing.assert_allclose(result.log_volume, np.log1p([5.0, 0.0, 7.0]))

    def test_multiple_rows_for_same_day_are_summed(self):
        series = [{"date": "2024-01-01", "volume": 3}, {"date": "2024-01-01", "volume": 4}]

        result = prepare_daily_series(series, start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 1))

        np.testing.assert_array_equal(result.volume, [7.0])

    def test_rows_outside_the_date_range_are_ignored(self):
        series = [{"date": "2023-12-31", "volume": 100}, {"date": "2024-01-01", "volume": 1}]

        result = prepare_daily_series(series, start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 1))

        np.testing.assert_array_equal(result.volume, [1.0])

    def test_start_after_end_raises(self):
        with self.assertRaises(ValueError):
            prepare_daily_series([], start_date=dt.date(2024, 1, 2), end_date=dt.date(2024, 1, 1))


class RunPeltTest(SimpleTestCase):
    def _series(self, n=40, shift_at=20, low=1.0, high=20.0):
        volume = np.array([low] * shift_at + [high] * (n - shift_at))
        dates = [dt.date(2024, 1, 1) + dt.timedelta(days=i) for i in range(n)]
        return dates, volume, np.log1p(volume)

    def test_empty_series_raises(self):
        with self.assertRaises(ValueError):
            run_pelt(start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 1),
                      dates=[], volume=np.array([]), log_volume=np.array([]))

    def test_detects_an_obvious_level_shift(self):
        dates, volume, log_volume = self._series()

        result = run_pelt(start_date=dates[0], end_date=dates[-1], dates=dates,
                            volume=volume, log_volume=log_volume, min_size=5)

        self.assertEqual(result.n_days, len(volume))
        self.assertGreaterEqual(len(result.segments), 2)
        # segments must fully tile the series with no gaps/overlaps
        self.assertEqual(result.segments[0].start_idx, 0)
        self.assertEqual(result.segments[-1].end_idx, len(volume))
        for prev, curr in zip(result.segments, result.segments[1:]):
            self.assertEqual(prev.end_idx, curr.start_idx)

class SummarizeRegimeChangesTest(SimpleTestCase):
    def test_pct_change_computed_from_medians(self):
        volume = np.array([2.0, 2.0, 8.0, 8.0])
        seg_a = _seg(0, 2, start=dt.date(2024, 1, 1), end=dt.date(2024, 1, 2), mode_volume=2)
        seg_b = _seg(2, 4, start=dt.date(2024, 1, 3), end=dt.date(2024, 1, 4), mode_volume=8)

        changes = summarize_regime_changes(segments=[seg_a, seg_b], volume=volume)

        self.assertEqual(len(changes), 1)
        change = changes[0]
        self.assertEqual((change.from_segment, change.to_segment), (0, 1))
        self.assertEqual(change.start, seg_b.start)
        self.assertAlmostEqual(change.pct_change, 300.0)
        self.assertEqual(change.prev_median, 2.0)
        self.assertEqual(change.curr_median, 8.0)

    def test_zero_prior_median_avoids_divide_by_zero(self):
        volume = np.array([0.0, 0.0, 5.0, 5.0])
        seg_a = _seg(0, 2, start=dt.date(2024, 1, 1), end=dt.date(2024, 1, 2))
        seg_b = _seg(2, 4, start=dt.date(2024, 1, 3), end=dt.date(2024, 1, 4))

        changes = summarize_regime_changes(segments=[seg_a, seg_b], volume=volume)

        self.assertIsNone(changes[0].pct_change)

    def test_three_segments_produce_two_adjacent_changes(self):
        volume = np.array([1.0, 1.0, 2.0, 2.0, 3.0, 3.0])
        segs = [
            _seg(0, 2, start=dt.date(2024, 1, 1), end=dt.date(2024, 1, 2)),
            _seg(2, 4, start=dt.date(2024, 1, 3), end=dt.date(2024, 1, 4)),
            _seg(4, 6, start=dt.date(2024, 1, 5), end=dt.date(2024, 1, 6)),
        ]

        changes = summarize_regime_changes(segments=segs, volume=volume)

        self.assertEqual([(c.from_segment, c.to_segment) for c in changes], [(0, 1), (1, 2)])
