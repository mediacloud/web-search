import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'search',
  initialState: { search: null},
  reducers: {
    setSearch: (state, { payload }) => {
      state.search = payload.count;
    }
  },
});

export const setSearch = slice.actions.setSearch

export const selectTotalAttention = (state) => state.search.search;

export default slice.reducer;
