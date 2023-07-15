/* eslint-disable no-undef */
import isQueryListBlank from '../src/features/search/util/isQueryListBlank';

test('[]', () => {
  const queryList = [];
  expect(isQueryListBlank(queryList)).toBe(true);
});

test('[[]]', () => {
  const queryList = [[]];
  expect(isQueryListBlank(queryList)).toBe(true);
});

test('[[[], []]]', () => {
  const queryList = [[[], []]];
  expect(isQueryListBlank(queryList)).toBe(true);
});

test('[[], [], []]', () => {
  const queryList = [[], [], []];
  expect(isQueryListBlank(queryList)).toBe(true);
});

test('[[], [], [""]]', () => {
  const queryList = [[], [], ['']];
  expect(isQueryListBlank(queryList)).toBe(true);
});

test('[["a"], ["b"], ["c"]]', () => {
  const queryList = [['a'], ['b'], ['c']];
  expect(isQueryListBlank(queryList)).toBe(false);
});
test('[[[[]]], [""] ]', () => {
  const queryList = [[[[]]], ['']];
  expect(isQueryListBlank(queryList)).toBe(true);
});

test('[""]', () => {
  const queryList = [''];
  expect(isQueryListBlank(queryList)).toBe(true);
});

test('["", ""]', () => {
  const queryList = ['', ''];
  expect(isQueryListBlank(queryList)).toBe(true);
});

test('["", "", "a"]', () => {
  const queryList = ['', '', 'a'];
  expect(isQueryListBlank(queryList)).toBe(false);
});

test('["", "", ""]', () => {
  const queryList = ['', '', 'a'];
  expect(isQueryListBlank(queryList)).toBe(false);
});
