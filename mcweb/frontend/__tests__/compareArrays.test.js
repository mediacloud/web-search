/* eslint-disable no-undef */
import compareArrays from '../src/features/search/util/compareArrays';

test('[1] [1]', () => {
  expect(compareArrays([1], [1])).toBe(true);
});

test('[1] [2]', () => {
  expect(compareArrays([1], [2])).toBe(false);
});

test('[2] [1]', () => {
  expect(compareArrays([2], [1])).toBe(false);
});

test('[1] [1,1]', () => {
  expect(compareArrays([1], [1, 1])).toBe(false);
});

test('[1,1] [1]', () => {
  expect(compareArrays([1, 1], [1])).toBe(false);
});

test('[[1]] [1]', () => {
  expect(compareArrays([[1]], [1])).toBe(false);
});

test('[[]] [1]', () => {
  expect(compareArrays([[]], [1])).toBe(false);
});

test('[1,2] [1,2]', () => {
  expect(compareArrays([1, 2], [1, 2])).toBe(true);
});

test('[2,1] [1,2]', () => {
  expect(compareArrays([2, 1], [1, 2])).toBe(false);
});

test('[1,2,3] [1,2]', () => {
  expect(compareArrays([1, 2, 3], [1, 2])).toBe(false);
});

test('[1,2,3] [1,2,3]', () => {
  expect(compareArrays([1, 2, 3], [1, 2, 3])).toBe(true);
});

test('[1,2,3] [1,2,[3]]', () => {
  expect(compareArrays([1, 2, 3], [1, 2, [3]])).toBe(false);
});

test('[2,1] [2,1]', () => {
  expect(compareArrays([2, 1], [2, 1])).toBe(true);
});

test('null, [1,2]', () => {
  expect(compareArrays(null, [1, 2])).toBe(false);
});

test('undefined, [1,2]', () => {
  expect(compareArrays(undefined, [1, 2])).toBe(false);
});

test('[1,2], null', () => {
  expect(compareArrays([1, 2], null)).toBe(false);
});

test('[1,2], undefined', () => {
  expect(compareArrays([1, 2], undefined)).toBe(false);
});
test('[2, 1] and [2, 1]', () => {
  expect(compareArrays([2, 1], [2, 1])).toBe(true);
});

test('[1, 2, 3] and [1, 2, 3]', () => {
  expect(compareArrays([1, 2, 3], [1, 2, 3])).toBe(true);
});

test('[1, 2, 3] and [3, 2, 1]', () => {
  expect(compareArrays([1, 2, 3], [3, 2, 1])).toBe(false);
});

test('[1, 2, 3] and [1, 2]', () => {
  expect(compareArrays([1, 2, 3], [1, 2])).toBe(false);
});

test('[1, 2, 3] and [1, 2, 3, 4]', () => {
  expect(compareArrays([1, 2, 3], [1, 2, 3, 4])).toBe(false);
});

test('[] and []', () => {
  expect(compareArrays([], [])).toBe(true);
});

test('null and [1, 2]', () => {
  expect(compareArrays(null, [1, 2])).toBe(false);
});

test('[[1],[2]]', () => {
  expect(compareArrays([[1]], [[2]])).toBe(false);
});

test('[[1,2,3]] [[1,2,3]]', () => {
  expect(compareArrays([[1, 2, 3]], [[1, 2, 3]])).toBe(true);
});

test('[[1,2,4]] [[1,2,3]]', () => {
  expect(compareArrays([[1, 2, 3, 4]], [[1, 2, 3]])).toBe(false);
});

test('[[1,2,3], [1,2]] [[1,2,3], [1,2]]', () => {
  expect(compareArrays([[1, 2, 3], [1, 2]], [[1, 2, 3], [1, 2]])).toBe(true);
});

test('[[1,2,3], [1]] [[1,2,3], [1,2]]', () => {
  expect(compareArrays([[1, 2, 3], [1]], [[1, 2, 3], [1, 2]])).toBe(false);
});

test('[[1,2,3], [1,2,3]], [[1,2,3], [1,2]]', () => {
  expect(compareArrays([[1, 2, 3], [1, 2, 3]], [[1, 2, 3], [1, 2]])).toBe(false);
});
