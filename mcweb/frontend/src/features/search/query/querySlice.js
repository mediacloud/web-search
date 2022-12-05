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
    lastSearchTime: dayjs().unix(),
    anyAll: 'any',
    advanced: false,
  },

  reducers: {
    addSelectedMedia: (state, { payload }) => ({ ...state, collections: payload }),
    removeSelectedMedia: (state, { payload }) => ({
      ...state,
      collections: state.collections.filter((collection) => collection.id !== payload),
      previewCollections: state.previewCollections.filter(
        (collection) => collection.id !== payload,
      ),
    }),
    addPreviewSelectedMedia: (state, { payload }) => ({
      ...state,
      previewCollections: [...state.previewCollections, payload],
    }),
    setPreviewSelectedMedia: (state, { payload }) => ({ ...state, previewCollections: payload }),
    removePreviewSelectedMedia: (state, { payload }) => ({
      ...state,
      previewCollections: state.previewCollections.filter(
        (collection) => collection.id !== payload,
      ),
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
