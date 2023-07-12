import simplifyTitles from '../src/features/search/util/tabTitleHelpers/simplifyTitles';

/* eslint-disable no-undef */
test('robot AND monkey, robot AND dog', () => {
  const titles = ['robot AND monkey', 'robot AND dog'];
  const anyAlls = ['all, all'];
  const result = ['monkey', 'dog'];
  expect(simplifyTitles(titles, anyAlls)).toStrictEqual(result);
});

test('cat AND monkey, robot AND dog', () => {
  const titles = ['cat AND monkey', 'robot AND dog'];
  const anyAlls = ['all, all'];
  const result = ['cat AND monkey', 'robot AND dog'];
  expect(simplifyTitles(titles, anyAlls)).toStrictEqual(result);
});

test('robot AND world AND monkey, robot AND world AND dog', () => {
  const titles = ['robot AND world AND monkey', 'robot AND world AND dog'];
  const anyAlls = ['all, all'];
  const result = ['monkey', 'dog'];
  expect(simplifyTitles(titles, anyAlls)).toStrictEqual(result);
});

test('monkey, dog', () => {
  const titles = ['monkey', 'dog'];
  const anyAlls = ['all, all'];
  const result = ['monkey', 'dog'];
  expect(simplifyTitles(titles, anyAlls)).toStrictEqual(result);
});

test('monkey AND love AND cat, monkey AND love', () => {
  const titles = ['monkey AND love AND cat', 'monkey AND love'];
  const anyAlls = ['all, all'];
  const result = ['cat', 'monkey AND love'];
  expect(simplifyTitles(titles, anyAlls)).toStrictEqual(result);
});

test('monkey OR love OR cat, monkey AND love', () => {
  const titles = ['monkey OR love OR cat', 'monkey AND love'];
  const anyAlls = ['any', 'all'];
  const result = ['monkey OR love OR cat', 'monkey AND love'];
  expect(simplifyTitles(titles, anyAlls)).toStrictEqual(result);
});
