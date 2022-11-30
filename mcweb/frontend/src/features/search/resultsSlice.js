import { createSlice } from '@reduxjs/toolkit';

const resultsSlice = createSlice({
  name: 'results',
  initialState: {
    count: null,
    countOverTime: null,
    words: null,
    sample: null,
  },
  reducers: {
    setQueryResults: (state, { payload }) => ({
      ...state,
      count: payload.count,
      countOverTime: payload.count_over_time,
      sample: payload.sample,
      words: payload.words,
    }),
  },
});

export const {
  setQueryResults,
} = resultsSlice.actions;

export default resultsSlice.reducer;
