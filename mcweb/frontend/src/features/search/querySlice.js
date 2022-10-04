import { createSlice, current } from '@reduxjs/toolkit';
import dayjs from 'dayjs';

const startDate = dayjs().subtract(30, 'day').format('MM/DD/YYYY');
const endDate = dayjs().format('MM/DD/YYYY');

const querySlice = createSlice({
    name: 'ui',
    initialState: { 'queryString': "", 'dataSource': "", 'startDate': startDate, 'endDate': endDate, 'collections':[], 'sources':[]},
    reducers: {
        addSelectedMedia: (state, {payload}) => {
            state.collections.push(payload);
        },
        removeSelectedMedia: (state, {payload}) => {
            state.collections = state.collections.filter(collection => collection.id !== payload);
        },
        setStartDate: (state, {payload}) => {
            state.startDate = payload;
        },
        setEndDate: (state, { payload }) => {
            state.endDate = payload;
        },
        setQueryString: (state, { payload }) => {
            state.queryString = payload;
        },
    },
});

export const { 
    addSelectedMedia, 
    removeSelectedMedia,
    setStartDate,
    setEndDate,
    setQueryString } = querySlice.actions;

export default querySlice.reducer;