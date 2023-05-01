import tabTitle from '../src/features/search/util/tabTitle';
// import { PROVIDER_NEWS_MEDIA_CLOUD } from '../src/features/search/util/platforms';

test('Empty Query (United States - National Collection)', () => {
  const queryState = [{
    advanced: false,
    anyAll: 'any',
    collections:
      [{
        id: 34412234,
        name: 'United States - National',
        public: true,
        type: 'collection',
      }],
    startDate: '03/28/2023',
    endDate: '04/30/2023',
    lastSearchTime: 1682943747,
    negatedQueryList: [[], [], []],
    platform: 'onlinenews-mediacloud',
    previewCollections: [{
      type: 'collection',
      id: 34412234,
      name: 'United States - National',
      platform: 'online_news',
      public: true,
    }],
    sources: [],
    previewSources: [],
    queryList: [[], [], []],
    queryString: '',
  }];

  const queryIndex = 0;

  expect(tabTitle(queryState, queryIndex)).toBe('Query 1');
});

test('Empty Query WayBackMachine', () => {
  const queryState = [{
    advanced: false,
    anyAll: 'any',
    collections:
      [{
        id: 34412234,
        name: 'United States - National',
        public: true,
        type: 'collection',
      }],
    startDate: '03/28/2023',
    endDate: '04/30/2023',
    lastSearchTime: 1682943747,
    negatedQueryList: [[], [], []],
    platform: 'onlinenews-waybackmachine',
    previewCollections: [{
      type: 'collection',
      id: 34412234,
      name: 'United States - National',
      platform: 'online_news',
      public: true,
    }],
    sources: [],
    previewSources: [],
    queryList: [[], [], []],
    queryString: '',
  }];

  const queryIndex = 0;

  expect(tabTitle(queryState, queryIndex)).toBe('Query 1');
});

test('Empty Query Reddit', () => {
  const queryState = [{
    advanced: false,
    anyAll: 'any',
    collections: [{
      id: 34412234,
      name: 'United States - National',
      public: true,
      type: 'collection',
    }],
    startDate: '03/28/2023',
    endDate: '04/30/2023',
    lastSearchTime: 1682943747,
    negatedQueryList: [[], [], []],
    platform: 'reddit-pushift',
    previewCollections: [{
      type: 'collection',
      id: 34412234,
      name: 'United States - National',
      platform: 'online_news',
      public: true,
    }],
    sources: [],
    previewSources: [],
    queryList: [[], [], []],
    queryString: '',
  }];

  const queryIndex = 0;

  expect(tabTitle(queryState, queryIndex)).toBe('Query 1');
});

test('Empty Query Twitter', () => {
  const queryState = [{
    advanced: false,
    anyAll: 'any',
    collections: [],
    startDate: '03/28/2023',
    endDate: '04/27/2023',
    lastSearchTime: 1682943747,
    negatedQueryList: [[], [], []],
    platform: 'twitter-twitter',
    previewCollections: [{
      type: 'collection',
      id: 34412234,
      name: 'United States - National',
      platform: 'online_news',
      public: true,
    }],
    previewSources: [],
    sources: [],
    queryList: [[], [], []],
    queryString: '',
  }];

  const queryIndex = 0;

  expect(tabTitle(queryState, queryIndex)).toBe('Query 1');
});

test('Empty Query Youtube', () => {
  const queryState = [{
    advanced: false,
    anyAll: 'any',
    collections: [],
    startDate: '03/28/2023',
    endDate: '04/27/2023',
    lastSearchTime: 1682943747,
    negatedQueryList: [[], [], []],
    platform: 'yotube-youtube',
    previewCollections: [{
      type: 'collection',
      id: 34412234,
      name: 'United States - National',
      platform: 'online_news',
      public: true,
    }],
    previewSources: [],
    sources: [],
    queryList: [[], [], []],
    queryString: '',
  }];

  const queryIndex = 0;

  expect(tabTitle(queryState, queryIndex)).toBe('Query 1');
});

test('Empty Query (United States - National Collection) (Two Identical Objects)', () => {
  const queryState = [{
    advanced: false,
    anyAll: 'any',
    collections:
      [{
        id: 34412234,
        name: 'United States - National',
        public: true,
        type: 'collection',
      }],
    startDate: '03/28/2023',
    endDate: '04/30/2023',
    lastSearchTime: 1682943747,
    negatedQueryList: [[], [], []],
    platform: 'onlinenews-mediacloud',
    previewCollections: [{
      type: 'collection',
      id: 34412234,
      name: 'United States - National',
      platform: 'online_news',
      public: true,
    }],
    sources: [],
    previewSources: [],
    queryList: [[], [], []],
    queryString: '',
  },
  {
    advanced: false,
    anyAll: 'any',
    collections:
      [{
        id: 34412234,
        name: 'United States - National',
        public: true,
        type: 'collection',
      }],
    startDate: '03/28/2023',
    endDate: '04/30/2023',
    lastSearchTime: 1682943747,
    negatedQueryList: [[], [], []],
    platform: 'onlinenews-mediacloud',
    previewCollections: [{
      type: 'collection',
      id: 34412234,
      name: 'United States - National',
      platform: 'online_news',
      public: true,
    }],
    sources: [],
    previewSources: [],
    queryList: [[], [], []],
    queryString: '',
  }];

  expect(tabTitle(queryState, 0)).toBe('Query 1');
  expect(tabTitle(queryState, 1)).toBe('Query 2');
});

test('Empty Query (United States - National Collection) (Two Identical Objects)', () => {
  const queryState = [{
    advanced: false,
    anyAll: 'any',
    collections:
      [{
        id: 34412234,
        name: 'United States - National',
        public: true,
        type: 'collection',
      }],
    startDate: '03/28/2023',
    endDate: '04/30/2023',
    lastSearchTime: 1682943747,
    negatedQueryList: [['War'], [], []],
    platform: 'onlinenews-waybackmachine',
    previewCollections: [{
      type: 'collection',
      id: 34412234,
      name: 'United States - National',
      platform: 'online_news',
      public: true,
    }],
    sources: [],
    previewSources: [],
    queryList: [['Love'], [], []],
    queryString: '',
  },
  {
    advanced: false,
    anyAll: 'any',
    collections:
      [{
        id: 34412234,
        name: 'United States - National',
        public: true,
        type: 'collection',
      }],
    startDate: '03/28/2023',
    endDate: '04/30/2023',
    lastSearchTime: 1682943747,
    negatedQueryList: [[], [], []],
    platform: 'reddit-reddit',
    previewCollections: [{
      type: 'collection',
      id: 34412234,
      name: 'United States - National',
      platform: 'online_news',
      public: true,
    }],
    sources: [],
    previewSources: [],
    queryList: [[], [], []],
    queryString: '',
  }];

  expect(tabTitle(queryState, 0)).toBe('(Love) AND NOT (War)');
  expect(tabTitle(queryState, 1)).toBe('Query 2');
});

