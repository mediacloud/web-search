/* eslint-disable no-undef */
import isQueryStateEmpty from '../src/features/search/util/isQueryStateEmpty';

test('empty', () => {
  const queryState = [
    {
      queryString: '',
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      advanced: false,
    },
    {
      queryString: '',
      queryList: [
        '',
      ],
      negatedQueryList: [
        [],
      ],
      advanced: false,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(true);
});

test('"a" in query 2', () => {
  const queryState = [
    {
      queryString: '',
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      advanced: false,
    },
    {
      queryString: '',
      queryList: [
        'a',
      ],
      negatedQueryList: [
        [],
      ],
      advanced: false,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(false);
});

test('"b" in negatedQueryList in query 1 and "a" in queryList in query 2', () => {
  const queryState = [
    {
      queryString: '',
      queryList: [
        [],
      ],
      negatedQueryList: [
        ['b'],
      ],
      advanced: false,
    },
    {
      queryString: '',
      queryList: [
        'a',
      ],
      negatedQueryList: [
        [],
      ],
      advanced: false,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(false);
});

test('advanced in query 1', () => {
  const queryState = [
    {
      queryString: 'hello',
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      advanced: true,
    },
    {
      queryString: '',
      queryList: [
        '',
      ],
      negatedQueryList: [
        [],
      ],
      advanced: false,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(false);
});

test('advanced in query 2', () => {
  const queryState = [
    {
      queryString: '',
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      advanced: false,
    },
    {
      queryString: 'hello',
      queryList: [
        '',
      ],
      negatedQueryList: [
        [],
      ],
      advanced: true,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(false);
});

test('advanced in query 1 & 2', () => {
  const queryState = [
    {
      queryString: 'a',
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      advanced: true,
    },
    {
      queryString: 'b',
      queryList: [
        '',
      ],
      negatedQueryList: [
        [],
      ],
      advanced: true,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(false);
});

test('advanced in query 1', () => {
  const queryState = [
    {
      queryString: 'a',
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      advanced: true,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(false);
});

test('empty queryState.length === 1', () => {
  const queryState = [
    {
      queryString: '',
      queryList: [
        [],
      ],
      negatedQueryList: [
        [],
      ],
      advanced: false,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(true);
});

test('"a" in queryList when queryState.length === 1', () => {
  const queryState = [
    {
      queryString: '',
      queryList: [
        ['a'],
      ],
      negatedQueryList: [
        [],
      ],
      advanced: false,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(false);
});

test('"a" in queryList "b" in negatedQueryList when queryState.length === 1', () => {
  const queryState = [
    {
      queryString: '',
      queryList: [
        ['a'],
      ],
      negatedQueryList: [
        ['b'],
      ],
      advanced: false,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(false);
});

test('"b" in negatedQueryList when queryState.length === 1', () => {
  const queryState = [
    {
      queryString: '',
      queryList: [
        [],
      ],
      negatedQueryList: [
        ['b'],
      ],
      advanced: false,
    },
  ];

  expect(isQueryStateEmpty(queryState)).toBe(false);
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
  expect(isQueryStateEmpty(queryState)).toBe(false);
});
