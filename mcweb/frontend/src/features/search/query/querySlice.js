import { createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import { PLATFORM_ONLINE_NEWS } from '../util/platforms';

const startDate = dayjs().subtract(34, 'day').format('MM/DD/YYYY');

const endDate = dayjs().subtract(4, 'day').format('MM/DD/YYYY');

const querySlice = createSlice({
  name: 'query',
  initialState: {
    queryString: '',
    queryList: [[], [], []],
    negatedQueryList: [[], [], []],
    platform: PLATFORM_ONLINE_NEWS, // "Choose a Platform",
    startDate,
    endDate,
    collections: [{ id: 34412234, name: 'United States - National' }],
    previewCollections: [{ id: 34412234, name: 'United States - National' }],
    sources: [],
    lastSearchTime: dayjs().format(),
    anyAll: 'any',
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
      previewCollections: state.previewCollections.push(payload),
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
} = querySlice.actions;

export default querySlice.reducer;
