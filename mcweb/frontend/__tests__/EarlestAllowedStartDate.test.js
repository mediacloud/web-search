import dayjs from 'dayjs';
import { earliestAllowedStartDate } from '../src/features/search/util/platforms';

test('PROVIDER_NEWS_WAYBACK_MACHINE', () => {
  const result = dayjs('2022-08-01').format('MM/DD/YYYY');
  const provider = 'onlinenews-waybackmachine';

  expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(result);
});

test('PROVIDER_NEWS_MEDIA_CLOUD', () => {
  const result = dayjs('2010-01-01').format('MM/DD/YYYY');
  const provider = 'onlinenews-mediacloud';

  expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(result);
});

test('PROVIDER_REDDIT_PUSHSHIFT', () => {
  const result = dayjs('2022-11-1').format('MM/DD/YYYY');
  const provider = 'reddit-pushshift';

  expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(result);
});

test('PROVIDER_YOUTUBE_YOUTUBE', () => {
  const result = dayjs('2010-01-01').format('MM/DD/YYYY');
  const provider = 'youtube-youtube';

  expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(result);
});

test('empty input', () => {
  const result = dayjs('2010-01-01').format('MM/DD/YYYY');
  const provider = '';

  expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(result);
});

test('null input', () => {
  const result = dayjs('2010-01-01').format('MM/DD/YYYY');
  const provider = null;

  expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(result);
});