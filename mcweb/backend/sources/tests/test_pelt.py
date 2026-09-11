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

from ..pelt.detect import run_pelt, segments_from_breakpoints, suggest_penalty
from ..pelt.detect import _segment_mode as detect_segment_mode
from ..pelt.preprocess import _coerce_date, prepare_daily_series
from ..pelt.summarize import summarize_regime_changes
from ..pelt.summarize import _segment_median, _segment_mode as summarize_segment_mode
from ..pelt.types import RegimeChange, Segment


def _seg(start_idx, end_idx, *, start, end, mean_volume=0.0, mean_log_volume=0.0, mode_volume=None):
    return Segment(
        start_idx=start_idx, end_idx=end_idx, start=start, end=end,
        mean_volume=mean_volume, mean_log_volume=mean_log_volume, mode_volume=mode_volume)


class CoerceDateTest(SimpleTestCase):
    def test_datetime_is_truncated_to_date(self):
        self.assertEqual(_coerce_date(dt.datetime(2024, 3, 5, 12, 30)), dt.date(2024, 3, 5))

    def test_date_passes_through(self):
        self.assertEqual(_coerce_date(dt.date(2024, 3, 5)), dt.date(2024, 3, 5))

    def test_iso_string_is_parsed(self):
        self.assertEqual(_coerce_date("2024-03-05"), dt.date(2024, 3, 5))

    def test_iso_datetime_string_is_truncated_to_date(self):
        self.assertEqual(_coerce_date("2024-03-05T12:30:00Z"), dt.date(2024, 3, 5))

    def test_unsupported_type_raises_type_error(self):
        with self.assertRaises(TypeError):
            _coerce_date(12345)


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

    def test_count_field_is_used_when_volume_is_absent(self):
        series = [{"date": "2024-01-01", "count": 9}]

        result = prepare_daily_series(series, start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 1))

        np.testing.assert_array_equal(result.volume, [9.0])

    def test_rows_outside_the_date_range_are_ignored(self):
        series = [{"date": "2023-12-31", "volume": 100}, {"date": "2024-01-01", "volume": 1}]

        result = prepare_daily_series(series, start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 1))

        np.testing.assert_array_equal(result.volume, [1.0])

    def test_start_after_end_raises(self):
        with self.assertRaises(ValueError):
            prepare_daily_series([], start_date=dt.date(2024, 1, 2), end_date=dt.date(2024, 1, 1))

    def test_row_missing_date_raises(self):
        with self.assertRaises(ValueError):
            prepare_daily_series([{"volume": 1}], start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 1))

    def test_row_missing_volume_and_count_raises(self):
        with self.assertRaises(ValueError):
            prepare_daily_series(
                [{"date": "2024-01-01"}], start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 1))

    def test_single_day_window(self):
        result = prepare_daily_series([], start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 1))
        self.assertEqual(result.dates, [dt.date(2024, 1, 1)])
        np.testing.assert_array_equal(result.volume, [0.0])


class SegmentModeTest(SimpleTestCase):
    def test_returns_most_frequent_value(self):
        volume = np.array([1, 1, 1, 2, 2])
        self.assertEqual(detect_segment_mode(volume, start_idx=0, end_idx=5), 1)

    def test_empty_slice_returns_none(self):
        volume = np.array([1, 2, 3])
        self.assertIsNone(detect_segment_mode(volume, start_idx=2, end_idx=2))

    def test_tie_resolves_to_the_smaller_value(self):
        volume = np.array([5, 5, 9, 9])
        self.assertEqual(detect_segment_mode(volume, start_idx=0, end_idx=4), 5)


class SuggestPenaltyTest(SimpleTestCase):
    def test_series_of_length_zero_or_one_returns_safe_fallback(self):
        self.assertEqual(suggest_penalty(np.array([])), 1.0)
        self.assertEqual(suggest_penalty(np.array([3.0])), 1.0)

    def test_constant_series_returns_safe_fallback(self):
        # zero variance -> penalty would be 0, guarded to 1.0 instead
        self.assertEqual(suggest_penalty(np.array([2.0] * 10)), 1.0)

    def test_varying_series_returns_a_positive_scaled_penalty(self):
        log_volume = np.log1p(np.array([1.0, 5.0, 1.0, 8.0, 2.0, 9.0, 1.0, 6.0]))
        penalty = suggest_penalty(log_volume)
        self.assertGreater(penalty, 0)

    def test_penalty_scale_multiplies_the_result(self):
        log_volume = np.log1p(np.array([1.0, 5.0, 1.0, 8.0, 2.0, 9.0, 1.0, 6.0]))
        base = suggest_penalty(log_volume, penalty_scale=1.0)
        scaled = suggest_penalty(log_volume, penalty_scale=2.0)
        self.assertAlmostEqual(scaled, base * 2.0)


class SegmentsFromBreakpointsTest(SimpleTestCase):
    def _dates(self, n):
        return [dt.date(2024, 1, 1) + dt.timedelta(days=i) for i in range(n)]

    def test_mismatched_lengths_raise(self):
        with self.assertRaises(ValueError):
            segments_from_breakpoints(
                breakpoints=[2], dates=self._dates(3), volume=np.zeros(2), log_volume=np.zeros(3))

    def test_empty_breakpoints_produce_a_single_segment_spanning_everything(self):
        volume = np.array([1.0, 2.0, 3.0])
        segments = segments_from_breakpoints(
            breakpoints=[], dates=self._dates(3), volume=volume, log_volume=np.log1p(volume))

        self.assertEqual(len(segments), 1)
        self.assertEqual((segments[0].start_idx, segments[0].end_idx), (0, 3))
        self.assertEqual(segments[0].start, dt.date(2024, 1, 1))
        self.assertEqual(segments[0].end, dt.date(2024, 1, 3))
        self.assertAlmostEqual(segments[0].mean_volume, 2.0)

    def test_breakpoints_not_ending_in_n_are_extended(self):
        volume = np.array([1.0, 2.0, 3.0, 4.0])
        segments = segments_from_breakpoints(
            breakpoints=[2], dates=self._dates(4), volume=volume, log_volume=np.log1p(volume))

        self.assertEqual(len(segments), 2)
        self.assertEqual((segments[0].start_idx, segments[0].end_idx), (0, 2))
        self.assertEqual((segments[1].start_idx, segments[1].end_idx), (2, 4))

    def test_duplicate_or_non_increasing_breakpoints_are_skipped(self):
        volume = np.array([1.0, 2.0, 3.0, 4.0])
        segments = segments_from_breakpoints(
            breakpoints=[2, 2, 4], dates=self._dates(4), volume=volume, log_volume=np.log1p(volume))

        self.assertEqual([(s.start_idx, s.end_idx) for s in segments], [(0, 2), (2, 4)])

    def test_segment_statistics_are_correct(self):
        volume = np.array([2.0, 2.0, 2.0, 8.0, 8.0])
        segments = segments_from_breakpoints(
            breakpoints=[3, 5], dates=self._dates(5), volume=volume, log_volume=np.log1p(volume))

        self.assertAlmostEqual(segments[0].mean_volume, 2.0)
        self.assertAlmostEqual(segments[1].mean_volume, 8.0)
        self.assertEqual(segments[0].mode_volume, 2)
        self.assertEqual(segments[1].mode_volume, 8)


class RunPeltTest(SimpleTestCase):
    def _series(self, n=40, shift_at=20, low=1.0, high=20.0):
        volume = np.array([low] * shift_at + [high] * (n - shift_at))
        dates = [dt.date(2024, 1, 1) + dt.timedelta(days=i) for i in range(n)]
        return dates, volume, np.log1p(volume)

    def test_empty_series_raises(self):
        with self.assertRaises(ValueError):
            run_pelt(start_date=dt.date(2024, 1, 1), end_date=dt.date(2024, 1, 1),
                      dates=[], volume=np.array([]), log_volume=np.array([]))

    def test_non_positive_explicit_penalty_raises(self):
        dates, volume, log_volume = self._series()
        with self.assertRaises(ValueError):
            run_pelt(start_date=dates[0], end_date=dates[-1], dates=dates,
                      volume=volume, log_volume=log_volume, penalty=0)

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

    def test_explicit_numeric_penalty_is_used_verbatim(self):
        dates, volume, log_volume = self._series()

        result = run_pelt(start_date=dates[0], end_date=dates[-1], dates=dates,
                            volume=volume, log_volume=log_volume, penalty=42.0)

        self.assertEqual(result.penalty, 42.0)


class SegmentMedianAndModeTest(SimpleTestCase):
    def test_segment_median(self):
        volume = np.array([1.0, 2.0, 3.0, 100.0])
        segment = _seg(0, 3, start=dt.date(2024, 1, 1), end=dt.date(2024, 1, 3))
        self.assertEqual(_segment_median(volume, segment), 2.0)

    def test_segment_median_empty_slice_is_zero(self):
        volume = np.array([1.0, 2.0])
        segment = _seg(2, 2, start=dt.date(2024, 1, 1), end=dt.date(2024, 1, 1))
        self.assertEqual(_segment_median(volume, segment), 0.0)

    def test_segment_mode_prefers_precomputed_value(self):
        volume = np.array([1, 1, 1])
        segment = _seg(0, 3, start=dt.date(2024, 1, 1), end=dt.date(2024, 1, 3), mode_volume=999)
        self.assertEqual(summarize_segment_mode(volume, segment), 999)

    def test_segment_mode_recomputes_when_not_precomputed(self):
        volume = np.array([1, 1, 2])
        segment = _seg(0, 3, start=dt.date(2024, 1, 1), end=dt.date(2024, 1, 3), mode_volume=None)
        self.assertEqual(summarize_segment_mode(volume, segment), 1)


class SummarizeRegimeChangesTest(SimpleTestCase):
    def test_fewer_than_two_segments_returns_empty_list(self):
        segment = _seg(0, 3, start=dt.date(2024, 1, 1), end=dt.date(2024, 1, 3))
        self.assertEqual(summarize_regime_changes(segments=[segment], volume=np.zeros(3)), [])
        self.assertEqual(summarize_regime_changes(segments=[], volume=np.zeros(3)), [])

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


class ToDictTest(SimpleTestCase):
    def test_segment_to_dict_isoformats_dates(self):
        segment = _seg(0, 1, start=dt.date(2024, 1, 1), end=dt.date(2024, 1, 1),
                        mean_volume=1.0, mean_log_volume=0.5, mode_volume=1)
        d = segment.to_dict()
        self.assertEqual(d["start"], "2024-01-01")
        self.assertEqual(d["end"], "2024-01-01")

    def test_regime_change_to_dict_isoformats_dates(self):
        change = RegimeChange(
            from_segment=0, to_segment=1, start=dt.date(2024, 1, 2), pct_change=50.0,
            prev_median=2.0, curr_median=3.0, prev_mode=2, curr_mode=3)
        d = change.to_dict()
        self.assertEqual(d["start"], "2024-01-02")
        self.assertEqual(d["from"], 0)
        self.assertEqual(d["to"], 1)
