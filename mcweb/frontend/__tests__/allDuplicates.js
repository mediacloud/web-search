/* eslint-disable no-undef */
import allDuplicates from '../src/features/search/util/tabTitleHelpers/allDuplicates';
import compareArrays from '../src/features/search/util/compareArrays';

test('[1, 1]', () => {
  expect(allDuplicates([1, 1])).toBe(true);
});

test('[1, 1, 2]', () => {
  expect(allDuplicates([1, 1, 2])).toBe(false);
});

test('[1, 2]', () => {
  expect(allDuplicates([1, 2])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates([1, 1])).toBe(true);
});

test('[false, false]', () => {
  expect(allDuplicates([false, false])).toBe(true);
});

test('[true, true]', () => {
  expect(allDuplicates([true, true])).toBe(true);
});

test('[false, true]', () => {
  expect(allDuplicates([false, true])).toBe(false);
});

test('[true, false]', () => {
  expect(allDuplicates([true, false])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates([1, 1])).toBe(true);
});

test('[1, 1, 2]', () => {
  expect(allDuplicates([1, 1, 2])).toBe(false);
});

test('[1, 2]', () => {
  expect(allDuplicates([1, 2])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates([1, 1])).toBe(true);
});

test('[[1], [1]]', () => {
  expect(allDuplicates([[1], [1]], compareArrays)).toBe(true);
});

test('[[1], [2]]', () => {
  expect(allDuplicates([[1], [2]], compareArrays)).toBe(false);
});

test('[[2], [1]]', () => {
  expect(allDuplicates([[2], [1], compareArrays])).toBe(false);
});

test('[[1] [1,1]]', () => {
  expect(allDuplicates([[2], [1]], compareArrays)).toBe(false);
});

test('[1,1] [1]', () => {
  expect(allDuplicates([[1, 1], [1]], compareArrays)).toBe(false);
});

test('[[1]] [1]', () => {
  expect(allDuplicates([[1], [1]], compareArrays)).toBe(true);
});

test('[[], [1]]', () => {
  expect(allDuplicates([[], [1]], compareArrays)).toBe(false);
});

test('[1,2] [1,2]', () => {
  expect(allDuplicates([[1, 2], [1, 2]], compareArrays)).toBe(true);
});

test('[2,1] [1,2]', () => {
  expect(allDuplicates([[2, 1], [1, 2]], compareArrays)).toBe(false);
});

test('[1,2,3] [1,2]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2]], compareArrays)).toBe(false);
});

test('[1,2,3] [1,2,3]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2, 3]], compareArrays)).toBe(true);
});

test('[1,2,3] [1,2,[3]]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2, [3]]], compareArrays)).toBe(false);
});

test('[2,1] [2,1]', () => {
  expect(allDuplicates([[2, 1], [2, 1]], compareArrays)).toBe(true);
});s

test('[1,2]', () => {
  expect(allDuplicates([[null], [1, 2]], compareArrays)).toBe(false);
});

test('undefined, [1,2]', () => {
  expect(allDuplicates([[undefined], [1, 2]], compareArrays)).toBe(false);
});

test('[1,2], null', () => {
  expect(allDuplicates([[1, 2], [null]], compareArrays)).toBe(false);
});

test('[1,2], undefined', () => {
  expect(allDuplicates([[1, 2], [undefined]], compareArrays)).toBe(false);
});

test('[2, 1] and [2, 1]', () => {
  expect(allDuplicates([[2, 1], [2, 1]], compareArrays)).toBe(true);
});

test('[1, 2, 3] and [1, 2, 3]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2, 3]], compareArrays)).toBe(true);
});

test('[1, 2, 3] and [3, 2, 1]', () => {
  expect(allDuplicates([[1, 2, 3], [3, 2, 1]], compareArrays)).toBe(false);
});

test('[1, 2, 3] and [1, 2]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2]], compareArrays)).toBe(false);
});

test('[1, 2, 3] and [1, 2, 3, 4]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2, 3, 4]], compareArrays)).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates([1, 1])).toBe(true);
});

test('[1, 1, 2]', () => {
  expect(allDuplicates([1, 1, 2])).toBe(false);
});

test('[1, 2]', () => {
  expect(allDuplicates([1, 2])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates([1, 1])).toBe(true);
});

test('[false, false]', () => {
  expect(allDuplicates([false, false])).toBe(true);
});

test('[true, true]', () => {
  expect(allDuplicates([true, true])).toBe(true);
});

test('[false, true]', () => {
  expect(allDuplicates([false, true])).toBe(false);
});

test('[true, false]', () => {
  expect(allDuplicates([true, false])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates([1, 1])).toBe(true);
});

test('[1, 1, 2]', () => {
  expect(allDuplicates([1, 1, 2])).toBe(false);
});

test('[1, 2]', () => {
  expect(allDuplicates([1, 2])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates([1, 1])).toBe(true);
});

test('[[1], [1]]', () => {
  expect(allDuplicates([[1], [1]], compareArrays)).toBe(true);
});

test('[[1], [2]]', () => {
  expect(allDuplicates([[1], [2]], compareArrays)).toBe(false);
});

test('[[2], [1]]', () => {
  expect(allDuplicates([[2], [1]], compareArrays)).toBe(false);
});

test('[[1] [1,1]]', () => {
  expect(allDuplicates([[2], [1]], compareArrays)).toBe(false);
});

test('[1,1] [1]', () => {
  expect(allDuplicates([[1, 1], [1]], compareArrays)).toBe(false);
});

test('[[1]] [1]', () => {
  expect(allDuplicates([[1], [1]], compareArrays)).toBe(true);
});

test('[[], [1]]', () => {
  expect(allDuplicates([[], [1]], compareArrays)).toBe(false);
});

test('[1,2] [1,2]', () => {
  expect(allDuplicates([[1, 2], [1, 2]], compareArrays)).toBe(true);
});

test('[2,1] [1,2]', () => {
  expect(allDuplicates([[2, 1], [1, 2]], compareArrays)).toBe(false);
});

test('[1,2,3] [1,2]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2]], compareArrays)).toBe(false);
});

test('[1,2,3] [1,2,3]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2, 3]], compareArrays)).toBe(true);
});

test('[1,2,3] [1,2,[3]]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2, [3]]], compareArrays)).toBe(false);
});

test('[2,1] [2,1]', () => {
  expect(allDuplicates([[2, 1], [2, 1]], compareArrays)).toBe(true);
});

test('[1,2]', () => {
  expect(allDuplicates([[null], [1, 2]], compareArrays)).toBe(false);
});

test('undefined, [1,2]', () => {
  expect(allDuplicates([[undefined], [1, 2]], compareArrays)).toBe(false);
});

test('[1,2], null', () => {
  expect(allDuplicates([[1, 2], [null]], compareArrays)).toBe(false);
});

test('[1,2], undefined', () => {
  expect(allDuplicates([[1, 2], [undefined]], compareArrays)).toBe(false);
});

test('[2, 1] and [2, 1]', () => {
  expect(allDuplicates([[2, 1], [2, 1]], compareArrays)).toBe(true);
});

test('[1, 2, 3] and [1, 2, 3]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2, 3]], compareArrays)).toBe(true);
});

test('[1, 2, 3] and [3, 2, 1]', () => {
  expect(allDuplicates([[1, 2, 3], [3, 2, 1]], compareArrays)).toBe(false);
});

test('[1, 2, 3] and [1, 2]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2]], compareArrays)).toBe(false);
});

test('[1, 2, 3] and [1, 2, 3, 4]', () => {
  expect(allDuplicates([[1, 2, 3], [1, 2, 3, 4]], compareArrays)).toBe(false);
});

test("['a', 'a']", () => {
  expect(allDuplicates(['a', 'a'])).toBe(true);
});

test("['a', 'a', 'b']", () => {
  expect(allDuplicates(['a', 'a', 'b'])).toBe(false);
});

test("['a', 'b']", () => {
  expect(allDuplicates(['a', 'b'])).toBe(false);
});

test("['a', 'a']", () => {
  expect(allDuplicates(['a', 'a'])).toBe(true);
});

test("['false', 'false']", () => {
  expect(allDuplicates(['false', 'false'])).toBe(true);
});

test("['true', 'true']", () => {
  expect(allDuplicates(['true', 'true'])).toBe(true);
});

test("['false', 'true']", () => {
  expect(allDuplicates(['false', 'true'])).toBe(false);
});

test("['true', 'false']", () => {
  expect(allDuplicates(['true', 'false'])).toBe(false);
});

test("['a', 'a']", () => {
  expect(allDuplicates(['a', 'a'])).toBe(true);
});

test("['a', 'a', 'b']", () => {
  expect(allDuplicates(['a', 'a', 'b'])).toBe(false);
});

test("['a', 'b']", () => {
  expect(allDuplicates(['a', 'b'])).toBe(false);
});

test("[['a'], ['a']]", () => {
  expect(allDuplicates([['a'], ['a']], compareArrays)).toBe(true);
});

test("[['a'], ['b']]", () => {
  expect(allDuplicates([['a'], ['b']], compareArrays)).toBe(false);
});

test("[['b'], ['a']]", () => {
  expect(allDuplicates([['b'], ['a']], compareArrays)).toBe(false);
});

test("[['a'], ['a', 'a']]", () => {
  expect(allDuplicates([['a'], ['a', 'a']], compareArrays)).toBe(false);
});

test("[['a', 'a'], ['a']]", () => {
  expect(allDuplicates([['a', 'a'], ['a']], compareArrays)).toBe(false);
});

test("[['a']], ['a']", () => {
  expect(allDuplicates([[['a']], ['a']], compareArrays)).toBe(false);
});

test("[[]], ['a']", () => {
  expect(allDuplicates([[[]], ['a']], compareArrays)).toBe(false);
});

test("['a', 'b'], ['a', 'b']", () => {
  expect(allDuplicates([['a', 'b'], ['a', 'b']], compareArrays)).toBe(true);
});

test("['b', 'a'], ['a', 'b']", () => {
  expect(allDuplicates([['b', 'a'], ['a', 'b']], compareArrays)).toBe(false);
});

test("['a', 'b', 'c'], ['a', 'b']", () => {
  expect(allDuplicates([['a', 'b', 'c'], ['a', 'b']], compareArrays)).toBe(false);
});

test("['a', 'b', 'c'] ['a', 'b', 'c']", () => {
  expect(allDuplicates([['a', 'b', 'c'], ['a', 'b', 'c']], compareArrays)).toBe(true);
});

test("['a', 'b', 'c'] ['a', 'b', ['c']]", () => {
  expect(allDuplicates([['a', 'b', 'c'], ['a', 'b', ['c']]], compareArrays)).toBe(false);
});

test("['b', 'a'] ['b', 'a']", () => {
  expect(allDuplicates([['b', 'a'], ['b', 'a']], compareArrays)).toBe(true);
});

test("null ['a', 'b']", () => {
  expect(allDuplicates([[null], ['a', 'b']], compareArrays)).toBe(false);
});
