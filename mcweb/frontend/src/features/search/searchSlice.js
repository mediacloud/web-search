import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'search',
  initialState: {
    search: null, queryList: null, negatedQueryList: null, fromDate: null, toDate: null,
  },
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload.count;
    },
    setQueryList: (state, { payload }) => {
      state.queryList = payload;
    },
    setNegatedQueryList: (state, { payload }) => {
      state.negatedQueryList = payload;
    },
    setFromDate: (state, { payload }) => {
      state.fromDate = payload;
    },
    setToDate: (state, { payload }) => {
      state.toDate = payload;
    },
  },
});

export const { setSearch } = slice.actions;
export const { setQueryList } = slice.actions;
export const { setNegatedQueryList } = slice.actions;
export const { setFromDate } = slice.actions;
export const { setToDate } = slice.actions;

export default slice.reducer;
