import existsInAll from '../src/features/search/util/tabTitleHelpers/existsInAll';

/* eslint-disable no-undef */
test('a in [a, b], [b, c] ', () => {
  const queryLists = [['a', 'b'], ['b', 'c']];
  expect(existsInAll('a', queryLists)).toBe(false);
});

test('b in [a, b], [b, c] ', () => {
  const queryLists = [['a', 'b'], ['b', 'c']];
  expect(existsInAll('b', queryLists)).toBe(true);
});

test('a in [a, b], [b, c] ', () => {
  const queryLists = [['a', 'b'], ['b', 'c']];
  expect(existsInAll('c', queryLists)).toBe(false);
});

test('a in [a, a], [a, a] ', () => {
  const queryLists = [['a', 'a'], ['a', 'a']];
  expect(existsInAll('a', queryLists)).toBe(true);
});

test('b in [a, a], [a, a] ', () => {
  const queryLists = [['a', 'a'], ['a', 'a']];
  expect(existsInAll('b', queryLists)).toBe(false);
});

test('c in [a, a], [a, c] ', () => {
  const queryLists = [['a', 'b'], ['b', 'c']];
  expect(existsInAll('c', queryLists)).toBe(false);
});
