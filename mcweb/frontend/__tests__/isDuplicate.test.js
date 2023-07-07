/* eslint-disable no-undef */
import isDuplicate from '../src/features/search/util/tabTitleHelpers/isDuplicate';

test('[1, 1]', () => {
  expect(isDuplicate(null, [1, 1])).toBe(true);
});

test('[1, 1, 2]', () => {
  expect(isDuplicate(null, [1, 1, 2])).toBe(false);
});

test('[1, 2]', () => {
  expect(isDuplicate(null, [1, 2])).toBe(false);
});
