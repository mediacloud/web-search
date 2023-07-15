/* eslint-disable no-undef */
import checkForBlankQuery from '../src/features/search/util/checkForBlankQuery';

test('PROVIDER_NEWS_WAYBACK_MACHINE', () => {
  const queryState = [
    {
      queryString: '',
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
      platform: 'onlinenews-mediacloud',
      startDate: '06/11/2023',
      endDate: '07/14/2023',
      collections: [
        34412234,
      ],
      previewCollections: [
        34412234,
      ],
      sources: [],
      previewSources: [],
      lastSearchTime: 1689440538,
      isFromDateValid: true,
      isToDateValid: true,
      anyAll: 'any',
      advanced: false,
    },
    {
      queryString: '',
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
      platform: 'onlinenews-mediacloud',
      startDate: '06/11/2023',
      endDate: '07/14/2023',
      collections: [],
      previewCollections: [],
      sources: [],
      previewSources: [],
      lastSearchTime: 1689440538,
      isFromDateValid: true,
      isToDateValid: true,
      anyAll: 'any',
      advanced: false,
    },
  ];
  expect(checkForBlankQuery(queryState)).toBe(false);
});
