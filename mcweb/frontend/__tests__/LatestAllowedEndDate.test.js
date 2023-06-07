/* eslint-disable no-undef */
import dayjs from 'dayjs';
import { latestAllowedEndDate } from '../src/features/search/util/platforms';

test('PROVIDER_NEWS_WAYBACK_MACHINE', () => {
  const today = dayjs();
  const provider = 'onlinenews-waybackmachine';

  expect(latestAllowedEndDate(provider).format('MM/DD/YYYY')).toBe(today.subtract('4', 'day').format('MM/DD/YYYY'));
});

test('PROVIDER_NEWS_MEDIA_CLOUD', () => {
  const today = dayjs();
  const provider = 'onlinenews-mediacloud';

  expect(latestAllowedEndDate(provider).format('MM/DD/YYYY')).toBe(today.subtract('1', 'day').format('MM/DD/YYYY'));
});

test('PROVIDER_REDDIT_PUSHSHIFT', () => {
  const today = dayjs().format('MM/DD/YYYY');
  const provider = 'reddit-pushsift';

  expect(latestAllowedEndDate(provider).format('MM/DD/YYYY')).toBe(today);
});

test('PROVIDER_YOUTUBE_YOUTUBE', () => {
  const today = dayjs().format('MM/DD/YYYY');
  const provider = 'youtube-youtube';

  expect(latestAllowedEndDate(provider).format('MM/DD/YYYY')).toBe(today);
});

test('empty input', () => {
  const today = dayjs().format('MM/DD/YYYY');
  const provider = '';

  expect(latestAllowedEndDate(provider).format('MM/DD/YYYY')).toBe(today);
});

test('null input', () => {
  const today = dayjs().format('MM/DD/YYYY');
  const provider = null;

  expect(latestAllowedEndDate(provider).format('MM/DD/YYYY')).toBe(today);
});
