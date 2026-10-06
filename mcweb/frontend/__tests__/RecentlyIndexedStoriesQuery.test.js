/* eslint-disable no-undef */
import { recentlyIndexedStoriesQuery } from '../src/app/services/searchApi';

test('requests stories indexed in the last 90 days across broad publication bounds', () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 6, 19, 12));
  try {
    expect(recentlyIndexedStoriesQuery({
      sourceId: 42,
      startDate: '2000-01-01',
      endDate: '2026-07-19',
    })).toEqual({
      url: 'story-list',
      method: 'GET',
      params: {
        q: 'indexed_date:[2026-04-20 TO *]',
        ss: 42,
        start: '2000-01-01',
        end: '2026-07-19',
        p: 'onlinenews-mediacloud',
        page_size: 10,
      },
    });
  } finally {
    jest.useRealTimers();
  }
});

test('requests stories indexed in a custom 30-day window', () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 6, 19, 12));
  try {
    expect(recentlyIndexedStoriesQuery({
      sourceId: 42,
      startDate: '2000-01-01',
      endDate: '2026-07-19',
      dayWindow: 30,
    }).params.q).toBe('indexed_date:[2026-06-19 TO *]');
  } finally {
    jest.useRealTimers();
  }
});
