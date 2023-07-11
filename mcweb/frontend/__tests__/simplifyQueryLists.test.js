import simplifyQueryList from '../src/features/search/util/tabTitleHelpers/simplifyQueryList';

/* eslint-disable no-undef */
test('Index 0: [Love and War], [War and Pain]', () => {
  expect(simplifyQueryList(
    0,
    [
      ['Love', 'War', []],
      ['War', 'Pain', []],
    ],
    ['all', 'all'],
  )).toStrictEqual(['Love']);
});

test('Index 1: [Love and War], [War and Pain]', () => {
  expect(simplifyQueryList(
    1,
    [
      ['Love', 'War', ''],
      ['War', 'Pain', ''],
    ],
    ['all', 'all'],
  )).toStrictEqual(['Pain']);
});

test('Index 0: [Love and Pain], [War and Pain]', () => {
  expect(simplifyQueryList(
    0,
    [
      ['Love', 'Pain', ''],
      ['War', 'Pain', ''],
    ],
    ['all', 'all'],
  )).toStrictEqual(['Love']);
});

test('Index 1: [Love and Pain], [War and Pain]', () => {
  expect(simplifyQueryList(
    1,
    [
      ['Love', 'Pain', ''],
      ['War', 'Pain', ''],
    ],
    ['all', 'all'],
  )).toStrictEqual(['War']);
});

test('Index 0: [Love and Pain], [War and Pain], [Fame and Pain]', () => {
  expect(simplifyQueryList(
    0,
    [
      ['Love', 'Pain', ''],
      ['War', 'Pain', ''],
      ['Fame', 'Pain', ''],
    ],
    ['all', 'all'],
  )).toStrictEqual(['Love']);
});

test('Index 1: [Love and Pain], [War and Pain], [Fame and Pain]', () => {
  expect(simplifyQueryList(
    1,
    [
      ['Love', 'Pain', ''],
      ['War', 'Pain', ''],
      ['Fame', 'Pain', ''],
    ],
    ['all', 'all'],
  )).toStrictEqual(['War']);
});

test('Index 1: [Love and Pain], [War and Pain], [Fame and Pain]', () => {
  expect(simplifyQueryList(
    2,
    [
      ['Love', 'Pain', ''],
      ['War', 'Pain', ''],
      ['Fame', 'Pain', ''],
    ],
    ['all', 'all'],
  )).toStrictEqual(['Fame']);
});

test('Index 0: [Love or War]  [Love OR War OR Pain]', () => {
  expect(simplifyQueryList(
    0,
    [
      [
        'Love', 'War', [],
      ],
      [
        'War', 'Pain', 'Love',
      ],
    ],
    ['any', 'any'],
  )).toStrictEqual(['Love', 'War', []]);
});

test('Index 1: [Love or War]  [Love OR War OR Pain]', () => {
  expect(simplifyQueryList(
    1,
    [
      [
        'Love', 'War', [],
      ],
      [
        'War', 'Pain', 'Love',
      ],
    ],
    ['any', 'any'],
  )).toStrictEqual(['Pain']);
});

test('Index 1: [Love]  [Love OR War OR Pain]', () => {
  expect(simplifyQueryList(
    1,
    [
      [
        'Love', [], [],
      ],
      [
        'War', 'Pain', 'Love',
      ],
    ],
    ['any', 'any'],
  )).toStrictEqual(['War', 'Pain']);
});

test('Index 0: [Love OR War OR Orange]  [Love OR War OR Orange]', () => {
  expect(simplifyQueryList(
    0,
    [
      [
        'Love', 'War', 'Orange',
      ],
      [
        'Love', 'War', 'Orange',
      ],
    ],
    ['any', 'any'],
  )).toStrictEqual(['Love', 'War', 'Orange']);
});

test('Index 1: [Love OR War OR Orange]  [Love OR War OR Orange]', () => {
  expect(simplifyQueryList(
    1,
    [
      [
        'Love', 'War', 'Orange',
      ],
      [
        'Love', 'War', 'Orange',
      ],
    ],
    ['any', 'any'],
  )).toStrictEqual(['Love', 'War', 'Orange']);
});
