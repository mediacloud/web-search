import { createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { PROVIDER_NEWS_MEDIA_CLOUD, latestAllowedEndDate } from '../util/platforms';
import { generateComparativeQuery } from '../util/generateComparativeQuery';

const DEFAULT_PROVIDER = PROVIDER_NEWS_MEDIA_CLOUD;
export const DEFAULT_ONLINE_NEWS_COLLECTIONS = [34412234];

export const QUERY = 'query';
export const MEDIA = 'media';
export const DATES = 'dates';

const startDate = dayjs().subtract(34, 'day').format('MM/DD/YYYY');

const cleanQuery = (platform) => ({
  queryString: '',
  queryList: [[], [], []],
  negatedQueryList: [[], [], []],
  platform,
  startDate,
  endDate: dayjs(latestAllowedEndDate(DEFAULT_PROVIDER)).format('MM/DD/YYYY'),
  collections: [],
  previewCollections: [],
  sources: [],
  previewSources: [],
  lastSearchTime: dayjs().unix(),
  initialSearchTime: dayjs().unix(),
  isFromDateValid: true,
  isToDateValid: true,
  anyAll: 'any',
  advanced: false,
  name: '',
  edited: false,
});

const querySlice = createSlice({
  name: 'query',
  initialState:
    [
      {
        queryString: '',
        queryList: [[], [], []],
        negatedQueryList: [[], [], []],
        platform: DEFAULT_PROVIDER,
        startDate,
        endDate: dayjs(latestAllowedEndDate(DEFAULT_PROVIDER)).format('MM/DD/YYYY'),
        collections: DEFAULT_ONLINE_NEWS_COLLECTIONS,
        previewCollections: DEFAULT_ONLINE_NEWS_COLLECTIONS,
        sources: [],
        previewSources: [],
        lastSearchTime: dayjs().unix(),
        initialSearchTime: dayjs().unix(),
        isFromDateValid: true,
        isToDateValid: true,
        anyAll: 'any',
        advanced: false,
        name: 'Query 1',
        edited: false,

      },
    ],

  reducers: {
    addSelectedMedia: (state, { payload }) => {
      const { queryIndex, sourceOrCollection } = payload;
      const currentSlice = state[queryIndex];
      currentSlice.collections = sourceOrCollection.filter((c) => c.type === 'collection').map((c) => c.id);
      currentSlice.sources = sourceOrCollection.filter((s) => s.type === 'source').map((s) => s.id);
    },
    setSelectedMedia: (state, { payload }) => {
      const { sourceOrCollection } = payload;
      const freezeState = state;
      const collections = new Array(sourceOrCollection.length);
      const sources = new Array(sourceOrCollection.length);
      sourceOrCollection.forEach((query, i) => {
        collections[i] = query.filter((m) => m.type === 'collection').map((c) => c.id);
        sources[i] = query.filter((m) => m.type === 'source').map((s) => s.id);
      });
      collections.forEach((c, i) => {
        freezeState[i].collections = c;
      });
      sources.forEach((s, i) => {
        freezeState[i].sources = s;
      });
      return freezeState;
    },
    addPreviewSelectedMedia: (state, { payload }) => {
      const { queryIndex, sourceOrCollection } = payload;
      const currentSlice = state[queryIndex];
      if (sourceOrCollection.type === 'collection') {
        currentSlice.previewCollections = [
          ...currentSlice.previewCollections, sourceOrCollection.id,
        ];
      } else {
        currentSlice.previewSources = [
          ...currentSlice.previewSources, sourceOrCollection.id,
        ];
      }
    },
    resetSelectedAndPreviewMedia: (state, { payload }) => {
      const { queryIndex } = payload;
      const currentSlice = state[queryIndex];
      currentSlice.collections = [];
      currentSlice.sources = [];
    },
    removeSelectedMedia: (state, { payload }) => {
      const { queryIndex, sourceOrCollection } = payload;
      const currentSlice = state[queryIndex];
      currentSlice.collections = sourceOrCollection.type === 'collection'
        ? currentSlice.collections.filter((c) => c !== sourceOrCollection.id) : currentSlice.collections;
      currentSlice.previewCollections = sourceOrCollection.type === 'collection'
        ? currentSlice.previewCollections.filter((c) => c !== sourceOrCollection.id) : currentSlice.collections;
      currentSlice.sources = sourceOrCollection.type === 'source'
        ? currentSlice.sources.filter((s) => s !== sourceOrCollection.id) : currentSlice.sources;
      currentSlice.previewSources = sourceOrCollection.type === 'source'
        ? currentSlice.previewSources.filter((s) => s !== sourceOrCollection.id) : currentSlice.sources;
    },
    setPreviewSelectedMedia: (state, { payload }) => {
      const { sourceOrCollection } = payload;
      const freezeState = state;
      const collections = new Array(sourceOrCollection.length);
      const sources = new Array(sourceOrCollection.length);
      sourceOrCollection.forEach((query, i) => {
        collections[i] = query.filter((m) => m.type === 'collection').map((c) => c.id);
        sources[i] = query.filter((m) => m.type === 'source').map((s) => s.id);
      });
      collections.forEach((c, i) => {
        freezeState[i].previewCollections = c;
      });
      sources.forEach((s, i) => {
        freezeState[i].previewSources = s;
      });
      return freezeState;
    },
    removePreviewSelectedMedia: (state, { payload }) => {
      const { queryIndex, sourceOrCollection } = payload;
      const currentSlice = state[queryIndex];
      currentSlice.previewCollections = currentSlice.previewCollections.filter((c) => c !== sourceOrCollection.id);
      currentSlice.previewSources = currentSlice.previewSources.filter((s) => s !== sourceOrCollection.id);
    },
    setQueryProperty: (state, { payload }) => {
      const queryProperty = payload.property;
      const currentQuerySlice = state[payload.queryIndex];
      currentQuerySlice[queryProperty] = payload[queryProperty];
    },
    addQuery: (state, { payload }) => {
      const freezeState = state;
      const lastQuery = freezeState[freezeState.length - 1] || {};
      freezeState.push(
        {
          queryString: '',
          queryList: [[], [], []],
          negatedQueryList: [[], [], []],
          platform: payload.platform || lastQuery.platform || DEFAULT_PROVIDER,
          startDate: lastQuery.startDate || startDate,
          endDate: lastQuery.endDate || dayjs(latestAllowedEndDate(DEFAULT_PROVIDER)).format('MM/DD/YYYY'),
          collections: [...(lastQuery.collections || [])],
          previewCollections: [...(lastQuery.previewCollections || [])],
          sources: [...(lastQuery.sources || [])],
          previewSources: [...(lastQuery.previewSources || [])],
          lastSearchTime: dayjs().unix(),
          isFromDateValid: true,
          isToDateValid: true,
          anyAll: 'any',
          advanced: payload.advanced || false,
          name: 'Query',
          edited: false,
        },
      );
    },
    setPlatform: (state, { payload }) => {
      state.forEach((qS) => {
        const copyqS = qS;
        copyqS.platform = payload;
      });
    },
    setLastSearchTime: (state, { payload }) => {
      const freezeState = state;

      freezeState.forEach((qS) => {
        const copyQs = qS;
        copyQs.lastSearchTime = payload;
      });
    },
    setInitialSearchTime: (state, { payload }) => {
      const freezeState = state;

      freezeState.forEach((qS) => {
        const copyQs = qS;
        copyQs.initialSearchTime = payload;
      });
    },
    addComparativeQuery: (state, { payload }) => {
      const { type, query } = payload;
      const newState = generateComparativeQuery(type, query);
      return newState;
    },
    removeQuery: (state, { payload }) => {
      const freezeState = state;
      if (payload === 0 && freezeState.length === 1) {
        freezeState.push(cleanQuery(freezeState[0].platform));
        freezeState.shift();
      } else if (payload === 0) {
        freezeState.shift();
      } else {
        freezeState.splice(payload, 1);
      }
    },
    copyToAllQueries: (state, { payload }) => {
      const freezeState = state;
      const queryProperty = payload.property;
      const { queryIndex } = payload;
      const queryData = freezeState[queryIndex];

      if (queryProperty === QUERY) {
        if (queryData.advanced) {
          const { queryString } = queryData;
          freezeState.forEach((query) => {
            const qsCopy = query;
            qsCopy.queryString = queryString;
          });
        } else {
          const { queryList, negatedQueryList, anyAll } = queryData;
          freezeState.forEach((query) => {
            const qsCopy = query;
            qsCopy.queryList = queryList;
            qsCopy.negatedQueryList = negatedQueryList;
            qsCopy.anyAll = anyAll;
          });
        }
      } else if (queryProperty === MEDIA) {
        const {
          collections, sources, previewCollections, previewSources,
        } = queryData;
        freezeState.forEach((query) => {
          const qsCopy = query;
          qsCopy.collections = collections;
          qsCopy.sources = sources;
          qsCopy.previewCollections = previewCollections;
          qsCopy.previewSources = previewSources;
        });
      } else if (queryProperty === DATES) {
        const { startDate: start, endDate: end } = queryData;
        freezeState.forEach((query) => {
          const qsCopy = query;
          qsCopy.startDate = start;
          qsCopy.endDate = end;
        });
      }
      return freezeState;
    },
  },
});

export const {
  addSelectedMedia,
  removeSelectedMedia,
  setQueryProperty,
  addPreviewSelectedMedia,
  removePreviewSelectedMedia,
  setPreviewSelectedMedia,
  resetSelectedAndPreviewMedia,
  addQuery,
  setPlatform,
  setLastSearchTime,
  removeQuery,
  setSelectedMedia,
  addComparativeQuery,
  copyToAllQueries,
  setInitialSearchTime,
} = querySlice.actions;

export default querySlice.reducer;