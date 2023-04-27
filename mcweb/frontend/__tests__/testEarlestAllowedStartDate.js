import dayjs from 'dayjs';
import { earliestAllowedStartDate } from '../src/features/search/util/platforms';


test('PROVIDER_NEWS_WAYBACK_MACHINE', () => {
  const result = dayjs('2022-08-01').format('MM/DD/YYYY');
  const provider = 'onlinenews-waybackmachine';

  expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(result);
});

test('PROVIDER_NEWS_MEDIA_CLOUD', () => {
  const today = dayjs();
  const provider = 'onlinenews-mediacloud';

  expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(today.subtract('1', 'day').format('MM/DD/YYYY'));
});

// test('PROVIDER_REDDIT_PUSHSHIFT', () => {
//   const today = dayjs().format('MM/DD/YYYY');
//   const provider = 'reddit-pushsift';

//   expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(today);
// });

// test('PROVIDER_YOUTUBE_YOUTUBE', () => {
//   const today = dayjs().format('MM/DD/YYYY');
//   const provider = 'youtube-youtube';

//   expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(today);
// });

// test('empty input', () => {
//   const today = dayjs().format('MM/DD/YYYY');
//   const provider = '';

//   expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(today);
// });

// test('null input', () => {
//   const today = dayjs().format('MM/DD/YYYY');
//   const provider = null;

//   expect(earliestAllowedStartDate(provider).format('MM/DD/YYYY')).toBe(today);
// });