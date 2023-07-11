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

test('Index 1: [Love OR War OR Orange]  [Love AND War AND Orange]', () => {
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
    ['any', 'all'],
  )).toStrictEqual(['Love', 'War', 'Orange']);
});

test('Index 0: [Love OR War OR Orange]  [Love AND War AND Orange]', () => {
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
    ['any', 'all'],
  )).toStrictEqual(['Love', 'War', 'Orange']);
});

test('Index 0: [A OR B OR C]  [B AND C AND D]', () => {
  expect(simplifyQueryList(
    0,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
    ],
    ['any', 'all'],
  )).toStrictEqual(['A', 'B', 'C']);
});

test('Index 1: [A AND B AND C]  [B OR C OR D]', () => {
  expect(simplifyQueryList(
    1,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
    ],
    ['all', 'any'],
  )).toStrictEqual(['B', 'C', 'D']);
});

test('Index 0: [A OR B OR C]  [B OR C OR D]', () => {
  expect(simplifyQueryList(
    0,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
    ],
    ['all', 'all'],
  )).toStrictEqual(['A']);
});

test('Index 1: [A OR B OR C]  [B OR C OR D]', () => {
  expect(simplifyQueryList(
    1,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
    ],
    ['any', 'any'],
  )).toStrictEqual(['D']);
});

test('Index 0: [A OR B OR C]  [B OR C OR D] [C OR D OR E]', () => {
  expect(simplifyQueryList(
    0,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
      [
        'C', 'D', 'E',
      ],
    ],
    ['any', 'any', 'any'],
  )).toStrictEqual(['A', 'B']);
});

test('Index 1: [A OR B OR C]  [B OR C OR D] [C OR D OR E]', () => {
  expect(simplifyQueryList(
    1,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
      [
        'C', 'D', 'E',
      ],
    ],
    ['any', 'any', 'any'],
  )).toStrictEqual(['B', 'D']);
});

test('Index 2: [A OR B OR C]  [B OR C OR D] [C OR D OR E]', () => {
  expect(simplifyQueryList(
    2,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
      [
        'C', 'D', 'E',
      ],
    ],
    ['any', 'any', 'any'],
  )).toStrictEqual(['D', 'E']);
});

test('Index 0: [A AND B AND C]  [B OR C OR D] [C OR D OR E]', () => {
  expect(simplifyQueryList(
    0,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
      [
        'C', 'D', 'E',
      ],
    ],
    ['all', 'any', 'any'],
  )).toStrictEqual(['A', 'B', 'C']);
});

test('Index 1: [A AND B AND C]  [B OR C OR D] [C OR D OR E]', () => {
  expect(simplifyQueryList(
    1,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
      [
        'C', 'D', 'E',
      ],
    ],
    ['all', 'any', 'any'],
  )).toStrictEqual(['B', 'C', 'D']);
});

test('Index 2: [A AND B AND C]  [B OR C OR D] [C OR D OR E]', () => {
  expect(simplifyQueryList(
    2,
    [
      [
        'A', 'B', 'C',
      ],
      [
        'B', 'C', 'D',
      ],
      [
        'C', 'D', 'E',
      ],
    ],
    ['all', 'any', 'any'],
  )).toStrictEqual(['C', 'D', 'E']);
});
