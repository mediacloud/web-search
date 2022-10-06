import { createSlice, current } from '@reduxjs/toolkit';

const resultsSlice = createSlice({
    name: 'results',
    initialState: {
        "count": null,
        "countOverTime": null,
        "words": null,
        "sample": null
    },
    reducers: {
        setQueryResults: (state, { payload }) => {
            state.count = payload.count;
            state.countOverTime = payload.count_over_time;
            state.sample = payload.sample;
            state.words = payload.words;
        },

    },
});

export const {
    setQueryResults,
 } = resultsSlice.actions;

export default resultsSlice.reducer;