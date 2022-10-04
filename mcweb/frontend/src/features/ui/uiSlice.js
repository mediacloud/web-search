import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
    name: 'ui',
    initialState: {'modal': false, 'tab': 'featuredCollections'},
    reducers: {
        openModal: (state, {payload}) => { //payload is the modal name
            state['modal'] = payload;
        },
        closeModal: (state) => {
            state['modal'] = false;
        },
    },
});

export const { openModal, closeModal } = uiSlice.actions;

export default uiSlice.reducer;