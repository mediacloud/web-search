/* eslint-disable no-undef */
import allDuplicates from '../src/features/search/util/tabTitleHelpers/isDuplicate';
import compareArrays from '../src/features/search/util/compareArrays';

test('[1, 1]', () => {
  expect(allDuplicates(null, [1, 1])).toBe(true);
});

test('[1, 1, 2]', () => {
  expect(allDuplicates(null, [1, 1, 2])).toBe(false);
});

test('[1, 2]', () => {
  expect(allDuplicates(null, [1, 2])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates(null, [1, 1])).toBe(true);
});

test('[false, false]', () => {
  expect(allDuplicates(null, [false, false])).toBe(true);
});

test('[true, true]', () => {
  expect(allDuplicates(null, [true, true])).toBe(true);
});

test('[false, true]', () => {
  expect(allDuplicates(null, [false, true])).toBe(false);
});

test('[true, false]', () => {
  expect(allDuplicates(null, [true, false])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates(null, [1, 1])).toBe(true);
});

test('[1, 1, 2]', () => {
  expect(allDuplicates(null, [1, 1, 2])).toBe(false);
});

test('[1, 2]', () => {
  expect(allDuplicates(null, [1, 2])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates(null, [1, 1])).toBe(true);
});

test('[[1], [1]]', () => {
  expect(allDuplicates(compareArrays, [[1], [1]])).toBe(true);
});

test('[[1], [2]]', () => {
  expect(allDuplicates(compareArrays, [[1], [2]])).toBe(false);
});

test('[[2], [1]]', () => {
  expect(allDuplicates(compareArrays, [[2], [1]])).toBe(false);
});

test('[[1] [1,1]]', () => {
  expect(allDuplicates(compareArrays, [[2], [1]])).toBe(false);
});

test('[1,1] [1]', () => {
  expect(allDuplicates(compareArrays, [[1, 1], [1]])).toBe(false);
});

test('[[1]] [1]', () => {
  expect(allDuplicates(compareArrays, [[1], [1]])).toBe(true);
});

test('[[], [1]]', () => {
  expect(allDuplicates(compareArrays, [[], [1]])).toBe(false);
});

test('[1,2] [1,2]', () => {
  expect(allDuplicates(compareArrays, [[1, 2], [1, 2]])).toBe(true);
});

test('[2,1] [1,2]', () => {
  expect(allDuplicates(compareArrays, [[2, 1], [1, 2]])).toBe(false);
});

test('[1,2,3] [1,2]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2]])).toBe(false);
});

test('[1,2,3] [1,2,3]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2, 3]])).toBe(true);
});

test('[1,2,3] [1,2,[3]]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2, [3]]])).toBe(false);
});

test('[2,1] [2,1]', () => {
  expect(allDuplicates(compareArrays, [[2, 1], [2, 1]])).toBe(true);
});

test('null, [1,2]', () => {
  expect(allDuplicates(compareArrays, [[null], [1, 2]])).toBe(false);
});

test('undefined, [1,2]', () => {
  expect(allDuplicates(compareArrays, [[undefined], [1, 2]])).toBe(false);
});

test('[1,2], null', () => {
  expect(allDuplicates(compareArrays, [[1, 2], [null]])).toBe(false);
});

test('[1,2], undefined', () => {
  expect(allDuplicates(compareArrays, [[1, 2], [undefined]])).toBe(false);
});

test('[2, 1] and [2, 1]', () => {
  expect(allDuplicates(compareArrays, [[2, 1], [2, 1]])).toBe(true);
});

test('[1, 2, 3] and [1, 2, 3]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2, 3]])).toBe(true);
});

test('[1, 2, 3] and [3, 2, 1]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [3, 2, 1]])).toBe(false);
});

test('[1, 2, 3] and [1, 2]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2]])).toBe(false);
});

test('[1, 2, 3] and [1, 2, 3, 4]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2, 3, 4]])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates(null, [1, 1])).toBe(true);
});

test('[1, 1, 2]', () => {
  expect(allDuplicates(null, [1, 1, 2])).toBe(false);
});

test('[1, 2]', () => {
  expect(allDuplicates(null, [1, 2])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates(null, [1, 1])).toBe(true);
});

test('[false, false]', () => {
  expect(allDuplicates(null, [false, false])).toBe(true);
});

test('[true, true]', () => {
  expect(allDuplicates(null, [true, true])).toBe(true);
});

test('[false, true]', () => {
  expect(allDuplicates(null, [false, true])).toBe(false);
});

test('[true, false]', () => {
  expect(allDuplicates(null, [true, false])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates(null, [1, 1])).toBe(true);
});

test('[1, 1, 2]', () => {
  expect(allDuplicates(null, [1, 1, 2])).toBe(false);
});

test('[1, 2]', () => {
  expect(allDuplicates(null, [1, 2])).toBe(false);
});

test('[1, 1]', () => {
  expect(allDuplicates(null, [1, 1])).toBe(true);
});

test('[[1], [1]]', () => {
  expect(allDuplicates(compareArrays, [[1], [1]])).toBe(true);
});

test('[[1], [2]]', () => {
  expect(allDuplicates(compareArrays, [[1], [2]])).toBe(false);
});

test('[[2], [1]]', () => {
  expect(allDuplicates(compareArrays, [[2], [1]])).toBe(false);
});

test('[[1] [1,1]]', () => {
  expect(allDuplicates(compareArrays, [[2], [1]])).toBe(false);
});

test('[1,1] [1]', () => {
  expect(allDuplicates(compareArrays, [[1, 1], [1]])).toBe(false);
});

test('[[1]] [1]', () => {
  expect(allDuplicates(compareArrays, [[1], [1]])).toBe(true);
});

test('[[], [1]]', () => {
  expect(allDuplicates(compareArrays, [[], [1]])).toBe(false);
});

test('[1,2] [1,2]', () => {
  expect(allDuplicates(compareArrays, [[1, 2], [1, 2]])).toBe(true);
});

test('[2,1] [1,2]', () => {
  expect(allDuplicates(compareArrays, [[2, 1], [1, 2]])).toBe(false);
});

test('[1,2,3] [1,2]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2]])).toBe(false);
});

test('[1,2,3] [1,2,3]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2, 3]])).toBe(true);
});

test('[1,2,3] [1,2,[3]]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2, [3]]])).toBe(false);
});

test('[2,1] [2,1]', () => {
  expect(allDuplicates(compareArrays, [[2, 1], [2, 1]])).toBe(true);
});

test('null, [1,2]', () => {
  expect(allDuplicates(compareArrays, [[null], [1, 2]])).toBe(false);
});

test('undefined, [1,2]', () => {
  expect(allDuplicates(compareArrays, [[undefined], [1, 2]])).toBe(false);
});

test('[1,2], null', () => {
  expect(allDuplicates(compareArrays, [[1, 2], [null]])).toBe(false);
});

test('[1,2], undefined', () => {
  expect(allDuplicates(compareArrays, [[1, 2], [undefined]])).toBe(false);
});

test('[2, 1] and [2, 1]', () => {
  expect(allDuplicates(compareArrays, [[2, 1], [2, 1]])).toBe(true);
});

test('[1, 2, 3] and [1, 2, 3]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2, 3]])).toBe(true);
});

test('[1, 2, 3] and [3, 2, 1]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [3, 2, 1]])).toBe(false);
});

test('[1, 2, 3] and [1, 2]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2]])).toBe(false);
});

test('[1, 2, 3] and [1, 2, 3, 4]', () => {
  expect(allDuplicates(compareArrays, [[1, 2, 3], [1, 2, 3, 4]])).toBe(false);
});

test("['a', 'a']", () => {
  expect(allDuplicates(null, ['a', 'a'])).toBe(true);
});

test("['a', 'a', 'b']", () => {
  expect(allDuplicates(null, ['a', 'a', 'b'])).toBe(false);
});

test("['a', 'b']", () => {
  expect(allDuplicates(null, ['a', 'b'])).toBe(false);
});

test("['a', 'a']", () => {
  expect(allDuplicates(null, ['a', 'a'])).toBe(true);
});

test("['false', 'false']", () => {
  expect(allDuplicates(null, ['false', 'false'])).toBe(true);
});

test("['true', 'true']", () => {
  expect(allDuplicates(null, ['true', 'true'])).toBe(true);
});

test("['false', 'true']", () => {
  expect(allDuplicates(null, ['false', 'true'])).toBe(false);
});

test("['true', 'false']", () => {
  expect(allDuplicates(null, ['true', 'false'])).toBe(false);
});

test("['a', 'a']", () => {
  expect(allDuplicates(null, ['a', 'a'])).toBe(true);
});

test("['a', 'a', 'b']", () => {
  expect(allDuplicates(null, ['a', 'a', 'b'])).toBe(false);
});

test("['a', 'b']", () => {
  expect(allDuplicates(null, ['a', 'b'])).toBe(false);
});

test("[['a'], ['a']]", () => {
  expect(allDuplicates(compareArrays, [['a'], ['a']])).toBe(true);
});

test("[['a'], ['b']]", () => {
  expect(allDuplicates(compareArrays, [['a'], ['b']])).toBe(false);
});

test("[['b'], ['a']]", () => {
  expect(allDuplicates(compareArrays, [['b'], ['a']])).toBe(false);
});

test("[['a'], ['a', 'a']]", () => {
  expect(allDuplicates(compareArrays, [['a'], ['a', 'a']])).toBe(false);
});

test("[['a', 'a'], ['a']]", () => {
  expect(allDuplicates(compareArrays, [['a', 'a'], ['a']])).toBe(false);
});

test("[['a']], ['a']", () => {
  expect(allDuplicates(compareArrays, [[['a']], ['a']])).toBe(false);
});

test("[[]], ['a']", () => {
  expect(allDuplicates(compareArrays, [[[]], ['a']])).toBe(false);
});

test("['a', 'b'], ['a', 'b']", () => {
  expect(allDuplicates(compareArrays, [['a', 'b'], ['a', 'b']])).toBe(true);
});

test("['b', 'a'], ['a', 'b']", () => {
  expect(allDuplicates(compareArrays, [['b', 'a'], ['a', 'b']])).toBe(false);
});

test("['a', 'b', 'c'], ['a', 'b']", () => {
  expect(allDuplicates(compareArrays, [['a', 'b', 'c'], ['a', 'b']])).toBe(false);
});

test("['a', 'b', 'c'] ['a', 'b', 'c']", () => {
  expect(allDuplicates(compareArrays, [['a', 'b', 'c'], ['a', 'b', 'c']])).toBe(true);
});

test("['a', 'b', 'c'] ['a', 'b', ['c']]", () => {
  expect(allDuplicates(compareArrays, [['a', 'b', 'c'], ['a', 'b', ['c']]])).toBe(false);
});

test("['b', 'a'] ['b', 'a']", () => {
  expect(allDuplicates(compareArrays, [['b', 'a'], ['b', 'a']])).toBe(true);
});

test("null ['a', 'b']", () => {
  expect(allDuplicates(compareArrays, [[null], ['a', 'b']])).toBe(false);
});
