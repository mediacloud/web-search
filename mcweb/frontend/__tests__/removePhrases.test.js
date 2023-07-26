import removePhrase from '../src/features/search/util/tabTitleHelpers/removePhrase';

/* eslint-disable no-undef */
test("'a', [['a', 'b'], ['a', 'c']]", () => {
  expect(removePhrase('a', [['a', 'b'], ['a', 'c']])).toStrictEqual([['b'], ['c']]);
});

test("'b', [['a', 'b'], ['a', 'c']]", () => {
  expect(removePhrase('b', [['a', 'b'], ['a', 'c']])).toStrictEqual([['a'], ['a', 'c']]);
});

test("'a', [['a', 'b'], ['a', 'c']]", () => {
  expect(removePhrase('c', [['a', 'b'], ['a', 'c']])).toStrictEqual([['a', 'b'], ['a']]);
});

test("'a', [['a', 'b'], ['a', 'c']]", () => {
  expect(removePhrase('d', [['a', 'b'], ['a', 'c']])).toStrictEqual([['a', 'b'], ['a', 'c']]);
});
