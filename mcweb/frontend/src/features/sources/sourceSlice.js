import { createSlice } from '@reduxjs/toolkit';

<<<<<<< HEAD
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
=======
const slice = createSlice({
  name: 'sources',

  initialState: { id: null, name: null, label: null, url: null}

})

export default slice.reducer
>>>>>>> 5ea79715ef36d9fe9c5e48cd94bca2e18a6337ca
