/* eslint-disable no-undef */
test('remove first element', () => {
  const array = [1, 2, 3, 4, 5];
  array.splice(0, 1);

  expect(array).toStrictEqual([2, 3, 4, 5]);
});

test('remove second element', () => {
  const array = [1, 2, 3, 4, 5];
  array.splice(1, 1);

  expect(array).toStrictEqual([1, 3, 4, 5]);
});

test('remove third element', () => {
  const array = [1, 2, 3, 4, 5];
  array.splice(2, 1);

  expect(array).toStrictEqual([1, 2, 4, 5]);
});

test('remove last element', () => {
  const array = [1, 2, 3, 4, 5];
  array.splice(array.length - 1, 1);

  expect(array).toStrictEqual([1, 2, 3, 4]);
});
