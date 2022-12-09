import { createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { PROVIDER_NEWS_MEDIA_CLOUD, latestAllowedEndDate } from '../util/platforms';

const DEFAULT_PROVIDER = PROVIDER_NEWS_MEDIA_CLOUD;
const DEFAULT_COLLECTIONS = [{ id: 34412234, name: 'United States - National' }];

const startDate = dayjs().subtract(34, 'day').format('MM/DD/YYYY');

const querySlice = createSlice({
  name: 'query',
  initialState: {
    queryString: '',
    queryList: [[], [], []],
    negatedQueryList: [[], [], []],
    platform: DEFAULT_PROVIDER,
    startDate,
    endDate: dayjs(latestAllowedEndDate(DEFAULT_PROVIDER)).format('MM/DD/YYYY'),
    collections: DEFAULT_COLLECTIONS,
    previewCollections: DEFAULT_COLLECTIONS,
    sources: [],
    previewSources: [],
    lastSearchTime: dayjs().unix(),
    anyAll: 'any',
    advanced: false,
  },

  reducers: {
    addSelectedMedia: (state, { payload }) => ({
      ...state,
      collections: payload.filter(c => c.type == 'collection'),
      sources: payload.filter(c => c.type == 'source'),
    }),
    addPreviewSelectedMedia: (state, { payload }) => ({
      ...state,
      previewCollections: [...state.collections, ...payload.filter(c => c.type == 'collection')],
      previewSources: [...state.sources, ...payload.filter(c => c.type == 'source')],
    }),
    removeSelectedMedia: (state, { payload }) => ({
      ...state,
      collections: payload.type == 'collection' ? state.collections.filter((c) => c.id !== payload.id) : state.collections,
      previewCollections: payload.type == 'collection' ? state.previewCollections.filter((c) => c.id !== payload.id) : state.collections,
      sources: payload.type == 'source' ? state.sources.filter((s) => s.id !== payload.id) : state.sources,
      previewSources: payload.type == 'source' ? state.previewSources.filter((s) => s.id !== payload.id) : state.sources,
    }),
    setPreviewSelectedMedia: (state, { payload }) => ({
      ...state,
      previewCollections: payload.filter(c => c.type == 'collection'),
      previewSources: payload.filter(c => c.type == 'source'),
    }),
    removePreviewSelectedMedia: (state, { payload }) => ({
      ...state,
      previewCollections: state.previewCollections.filter((c) => c.id !== payload.id),
      previewSources: state.previewSources.filter((s) => s.id !== payload.id),
    }),
    setStartDate: (state, { payload }) => ({ ...state, startDate: payload }),
    setEndDate: (state, { payload }) => ({ ...state, endDate: payload }),
    setQueryString: (state, { payload }) => ({ ...state, queryString: payload }),
    setQueryList: (state, { payload }) => ({ ...state, queryList: payload }),
    setNegatedQueryList: (state, { payload }) => ({ ...state, negatedQueryList: payload }),
    setPlatform: (state, { payload }) => ({ ...state, platform: payload }),
    setSearchTime: (state, { payload }) => ({ ...state, lastSearchTime: payload }),
    setAnyAll: (state, { payload }) => ({ ...state, anyAll: payload }),
    setAdvanced: (state, { payload }) => ({ ...state, advanced: payload }),
  },
});

export const {
  addSelectedMedia,
  removeSelectedMedia,
  setStartDate,
  setEndDate,
  setQueryString,
  setQueryList,
  setNegatedQueryList,
  setPlatform,
  setSearchTime,
  addPreviewSelectedMedia,
  removePreviewSelectedMedia,
  setAnyAll,
  setPreviewSelectedMedia,
  setAdvanced,
} = querySlice.actions;

export default querySlice.reducer;
