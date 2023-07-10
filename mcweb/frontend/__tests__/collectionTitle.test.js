/* eslint-disable no-undef */
import collectionTitle from '../src/features/search/util/tabTitleHelpers/collectionTitle';

test('[a, b]', () => {
  expect(collectionTitle(['a', 'b'])).toBe("'a' & 'b'");
});

test('[a, b, c]', () => {
  expect(collectionTitle(['a', 'b', 'c'])).toBe("'a' & 'b' & 'c'");
});

test('[a]', () => {
  expect(collectionTitle(['a'])).toBe("'a'");
});

test('[]', () => {
  expect(collectionTitle([])).toBe('No Selected Collections or Sources');
});
