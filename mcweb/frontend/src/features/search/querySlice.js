import { createSlice, current } from '@reduxjs/toolkit';

const querySlice = createSlice({
    name: 'ui',
    initialState: {'queryString': "", 'collections':[], 'sources':[]},
    reducers: {
        addSelectedMedia: (state, {payload}) => {
            state.collections.push(payload);
        },
        removeSelectedMedia: (state, {payload}) => {
            state.collections = state.collections.filter(collection => collection.id !== payload);
        }
    },
});

export const { addSelectedMedia, removeSelectedMedia } = querySlice.actions;

export default querySlice.reducer;