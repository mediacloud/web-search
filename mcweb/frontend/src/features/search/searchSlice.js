import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'search',
  initialState: { search: null, queryList: null, negatedQueryList: null, fromDate: null, toDate: null },
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload.count;
    },
    setQueryList: (state, {payload}) => {
      state.queryList = payload;
    }, 
    setNegatedQueryList: (state, {payload}) => {
      state.negatedQueryList = payload;
    }, 
    setFromDate: (state, { payload }) => {
      state.fromDate = payload;
    },
    setToDate: (state, { payload }) => {
      state.toDate = payload;
    }
  },
});

export const setSearch = slice.actions.setSearch;
export const setQueryList = slice.actions.setQueryList;
export const setNegatedQueryList = slice.actions.setNegatedQueryList;
export const setFromDate = slice.actions.setFromDate;
export const setToDate = slice.actions.setToDate;

// export const selectTotalAttention = (state) => state.search.search;
// export const selectQuery = (state) => state.search.queryList;
// export const selectNegatedQuery = (state) => state.search.negatedQueryList;
// export const selectFromDate = (state) => state.search.fromDate;
// export const selectToDate = (state) => state.search.toDate;

export default slice.reducer;
