import { createSlice } from '@reduxjs/toolkit';

const querySlice = createSlice({
    name: 'ui',
    initialState: {'queryString': "", 'collections':[], 'sources':[]},
    reducers: {
        addSelectedMedia: (state, {payload}) => {
            state.collections.push(payload);
        },
    },
});

export const { addSelectedMedia } = querySlice.actions;

export default querySlice.reducer;