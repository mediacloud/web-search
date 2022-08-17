import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    id: null,
    name: null,
    url_search_string: null,
    label: null,
    homepage: null,
    notes: null,
    service: null,
    stories_per_week: null,
    pub_country: null,
    pub_state: null,
    primary_language: null,
    media_type: null
}
const sourceSlice = createSlice({
    name: 'sources',
    initialState: {},
    reducers: {
        setSource: (state, { payload }) => {
            // console.log(state)
            console.log(payload)
            // state = payload;
            state.sources = {...payload} 
            // state.sources = payload.sources.id
            // payload.map(source => (
            //     console.log(source)
            // ))
            // state.source = payload;
    }
    },
});

export const setSource = sourceSlice.actions.setSource

// export const selectTotalAttention = (state) => state.search.search;

export default sourceSlice.reducer;