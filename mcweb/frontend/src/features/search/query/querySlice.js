import { createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { PROVIDER_NEWS_MEDIA_CLOUD, latestAllowedEndDate } from '../util/platforms';

const DEFAULT_PROVIDER = PROVIDER_NEWS_MEDIA_CLOUD;
export const DEFAULT_ONLINE_NEWS_COLLECTIONS = [{
  type: 'collection',
  id: 34412234,
  name: 'United States - National',
  platform: 'online_news',
  public: true,
}];

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
    collections: DEFAULT_ONLINE_NEWS_COLLECTIONS,
    previewCollections: DEFAULT_ONLINE_NEWS_COLLECTIONS,
    sources: [],
    previewSources: [],
    lastSearchTime: dayjs().unix(),
    anyAll: 'any',
    advanced: false,
  },

  reducers: {
    addSelectedMedia: (state, { payload }) => ({
      ...state,
      collections: payload.filter((c) => c.type === 'collection'),
      sources: payload.filter((c) => c.type === 'source'),
    }),
    addPreviewSelectedMedia: (state, { payload }) => ({
      ...state,
      previewCollections: [...state.previewCollections, ...payload.filter((c) => c.type === 'collection')],
      previewSources: [...state.previewSources, ...payload.filter((c) => c.type === 'source')],
    }),
    resetSelectedAndPreviewMedia: (state) => ({
      ...state,
      collections: [],
      previewCollections: [],
      sources: [],
      previewSources: [],
    }),
    removeSelectedMedia: (state, { payload }) => ({
      ...state,
      collections: payload.type === 'collection' ? state.collections.filter((c) => c.id !== payload.id) : state.collections,
      previewCollections: payload.type === 'collection'
        ? state.previewCollections.filter((c) => c.id !== payload.id) : state.collections,
      sources: payload.type === 'source' ? state.sources.filter((s) => s.id !== payload.id) : state.sources,
      previewSources: payload.type === 'source' ? state.previewSources.filter((s) => s.id !== payload.id) : state.sources,
    }),
    setPreviewSelectedMedia: (state, { payload }) => ({
      ...state,
      previewCollections: payload.filter((c) => c.type === 'collection'),
      previewSources: payload.filter((c) => c.type === 'source'),
    }),
    removePreviewSelectedMedia: (state, { payload }) => ({
      ...state,
      previewCollections: state.previewCollections.filter((c) => c.id !== payload.id),
      previewSources: state.previewSources.filter((s) => s.id !== payload.id),
    }),

    setQueryProperty: (state, { payload }) => ({ ...state, ...payload }),
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
} = querySlice.actions;

export default querySlice.reducer;
