import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   id: null,
//   name: null,
//   url_search_string: null,
//   label: null,
//   homepage: null,
//   notes: null,
//   service: null,
//   stories_per_week: null,
//   pub_country: null,
//   pub_state: null,
//   primary_language: null,
//   media_type: null,
// };

const sourceSlice = createSlice({
  name: 'sources',
  initialState: {},
  reducers: {
    setSource: (state, { payload }) => ({
      ...state,
      [payload.sources.id]: payload.sources,
    }),
    setSources: (state, { payload }) => {
      const newVals = {};
      payload.sources.forEach((source) => {
        newVals[source.id] = source;
      });
      return {
        ...state,
        ...newVals,
      };
    },
  },
});

export const { setSource, setSources } = sourceSlice.actions;

export default sourceSlice.reducer;
