/* eslint-disable no-undef */

import checkForBlankQuery from '../src/features/search/util/checkForBlankQuery';

test('item in queryList 1 and 2', () => {
  const queryState = [
    {
      queryList: [
        'Love',
        [],
        [],
      ],
      negatedQueryList: [
        [],
        [],
        [],
      ],
      queryString: '',
      advanced: false,
    },
    {
      queryList: [
        'World',
        [],
        [],
      ],
      negatedQueryList: [
        [],
        [],
        [],
      ],
      queryString: '',
      advanced: false,
    },
  ];
  expect(checkForBlankQuery(queryState)).toBe(false);
});

test('empty in queryList 1 and 2', () => {
  const queryState = [
    {
      queryList: [
        '',
        [],
        [],
      ],
      negatedQueryList: [
        [],
        [],
        [],
      ],
      queryString: '',
      advanced: false,
    },
    {
      queryList: [
        '',
        [],
        [],
      ],
      negatedQueryList: [
        [],
        [],
        [],
      ],
      queryString: '',
      advanced: false,
    },
  ];
  expect(checkForBlankQuery(queryState)).toBe(true);
});

test('empty str in queryList 1', () => {
  const queryState = [
    {
      queryList: [
        '    ',
        [],
        [],
      ],
      negatedQueryList: [
        [],
        [],
        [],
      ],
      queryString: '',
      advanced: false,
    },
    {
      queryList: [
        [],
        [],
        [],
      ],
      negatedQueryList: [
        [],
        [],
        [],
      ],
      queryString: '',
      advanced: false,
    },
  ];
  expect(checkForBlankQuery(queryState)).toBe(true);
});

test('"a" str in queryList 1', () => {
  const queryState = [
    {
      queryList: [
        'a',
      ],
      negatedQueryList: [
        [],
      ],
      queryString: '',
      advanced: false,
    },
    {
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      queryString: '',
      advanced: false,
    },
  ];
  expect(checkForBlankQuery(queryState)).toBe(true);
});

test('"a" str in queryList 1', () => {
  const queryState = [
    {
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      queryString: 'Hello',
      advanced: true,
    },
    {
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      queryString: '',
      advanced: false,
    },
  ];
  expect(checkForBlankQuery(queryState)).toBe(true);
});

test('issue', () => {
  const queryState = [
    {
      queryString: '',
      queryList: [
        [],
        [],
        [],
      ],
      negatedQueryList: [
        [],
        [],
        [],
      ],
      advanced: false,
    },
    {
      queryString: '',
      queryList: [
        'W',
        [],
        [],
      ],
      negatedQueryList: [
        [],
        [],
        [],
      ],
      advanced: false,
    },
  ];
  expect(checkForBlankQuery(queryState)).toBe(true);
});
