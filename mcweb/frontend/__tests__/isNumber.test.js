/* eslint-disable no-undef */
import isNumber from '../src/features/search/util/isNumber';

test('1', () => {
  expect(isNumber(1)).toBe(true);
});

test('2', () => {
  expect(isNumber(2)).toBe(true);
});

test('-1', () => {
  expect(isNumber(-1)).toBe(true);
});

test('10', () => {
  expect(isNumber(10)).toBe(true);
});

test('0', () => {
  expect(isNumber(0)).toBe(true);
});

test('-5.5', () => {
  expect(isNumber(-5.5)).toBe(true);
});

test('3.14159', () => {
  expect(isNumber(3.14159)).toBe(true);
});

test('1000000000', () => {
  expect(isNumber(1000000000)).toBe(true);
});

test('-0.123', () => {
  expect(isNumber(-0.123)).toBe(true);
});

test('0.0', () => {
  expect(isNumber(0.0)).toBe(true);
});

test('"42"', () => {
  expect(isNumber('42')).toBe(false);
});

test('"3.14"', () => {
  expect(isNumber('3.14')).toBe(false);
});

test('"-10"', () => {
  expect(isNumber('-10')).toBe(false);
});

test('"-5.5"', () => {
  expect(isNumber('-5.5')).toBe(false);
});

test('"0.123"', () => {
  expect(isNumber('0.123')).toBe(false);
});

test('"0.0"', () => {
  expect(isNumber('0.0')).toBe(false);
});

test('null', () => {
  expect(isNumber(null)).toBe(false);
});

test('undefined', () => {
  expect(isNumber(undefined)).toBe(false);
});

test('true', () => {
  expect(isNumber(true)).toBe(false);
});

test('false', () => {
  expect(isNumber(false)).toBe(false);
});

test('NaN', () => {
  expect(isNumber(NaN)).toBe(false);
});

test('Infinity', () => {
  expect(isNumber(Infinity)).toBe(false);
});

test('-Infinity', () => {
  expect(isNumber(-Infinity)).toBe(false);
});

test('string', () => {
  expect(isNumber('Hello')).toBe(false);
});

test('empty string', () => {
  expect(isNumber('')).toBe(false);
});

test('array', () => {
  expect(isNumber([1, 2, 3])).toBe(false);
});

test('2d array', () => {
  expect(isNumber([[1, 2, 3], [1, 2]])).toBe(false);
});
