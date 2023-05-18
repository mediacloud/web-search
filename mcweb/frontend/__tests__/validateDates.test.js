/* eslint-disable no-undef */
import dayjs from 'dayjs';
import validateDate from '../src/features/search/util/dateValidation';

test('On Max Day ', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2010').format('MM/DD/YYYY');
  const date = dayjs('01/01/2010').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(true);
});

test('On Min Day ', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2010').format('MM/DD/YYYY');
  const date = dayjs('01/01/2000').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(true);
});

test('In Between Min and Max Day', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2005').format('MM/DD/YYYY');
  const date = dayjs('01/01/2001').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(true);
});

test('In Between Min and Max Day (2)', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2005').format('MM/DD/YYYY');
  const date = dayjs('01/01/2002').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(true);
});

test('In Between Min and Max Day (3)', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2005').format('MM/DD/YYYY');
  const date = dayjs('01/01/2003').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(true);
});

test('In Between Min and Max Day (4)', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2005').format('MM/DD/YYYY');
  const date = dayjs('12/31/2004').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(true);
});

test('Outside Minimum Day', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2005').format('MM/DD/YYYY');
  const date = dayjs('01/01/1999').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('Outside Max Day', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2005').format('MM/DD/YYYY');
  const date = dayjs('01/01/2006').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('Deleting Last Index of Year', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2005').format('MM/DD/YYYY');
  const date = dayjs('01/01/200').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('Deleting Last Index of Year (2) ', () => {
  const minDate = dayjs('01/01/2000').format('MM/DD/YYYY');
  const maxDate = dayjs('01/01/2005').format('MM/DD/YYYY');
  const date = dayjs('01/01/20').format('MM/DD/YYYY');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('Real Example (max day)', () => {
  const minDate = dayjs('03/24/2023').format('MM/DD/YYYY');
  const maxDate = dayjs('04/23/2023').format('MM/DD/YYYY');
  const date = dayjs('04/23/2023');

  expect(validateDate(date, minDate, maxDate)).toBe(true);
});

test('Real Example (deleting last index of year)', () => {
  const minDate = dayjs('03/24/2023').format('MM/DD/YYYY');
  const maxDate = dayjs('04/23/2023').format('MM/DD/YYYY');
  const date = dayjs('04/23/202');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('Real Example (deleting last index of year again)', () => {
  const minDate = dayjs('03/24/2023').format('MM/DD/YYYY');
  const maxDate = dayjs('04/23/2023').format('MM/DD/YYYY');
  const date = dayjs('04/23/20');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('Real Example (deleting last index of year again)', () => {
  const minDate = dayjs('03/24/2023').format('MM/DD/YYYY');
  const maxDate = dayjs('04/23/2023').format('MM/DD/YYYY');
  const date = dayjs('04/23/2');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('Real Example (deleting last index of year again)', () => {
  const minDate = dayjs('03/24/2023').format('MM/DD/YYYY');
  const maxDate = dayjs('04/23/2023').format('MM/DD/YYYY');
  const date = dayjs('04/23/');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('No Day', () => {
  const minDate = dayjs('03/24/2023').format('MM/DD/YYYY');
  const maxDate = dayjs('04/23/2023').format('MM/DD/YYYY');
  const date = dayjs('/23/2023');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('No month', () => {
  const minDate = dayjs('03/24/2023').format('MM/DD/YYYY');
  const maxDate = dayjs('04/23/2023').format('MM/DD/YYYY');
  const date = dayjs('01//2023');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});

test('Negative month', () => {
  const minDate = dayjs('03/24/2023').format('MM/DD/YYYY');
  const maxDate = dayjs('04/23/2023').format('MM/DD/YYYY');
  const date = dayjs('01/-1/2023');

  expect(validateDate(date, minDate, maxDate)).toBe(false);
});