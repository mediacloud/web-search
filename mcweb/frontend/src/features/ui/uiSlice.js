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
        changeTab: (state, {payload}) => {
            state['tab'] = payload;
        }
    },
});

export const { openModal, closeModal, changeTab } = uiSlice.actions;

export default uiSlice.reducer;