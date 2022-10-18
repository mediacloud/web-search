import { createSlice, current } from '@reduxjs/toolkit';
import dayjs from 'dayjs';

const startDate = dayjs().subtract(30, 'day').format('MM/DD/YYYY');
const endDate = dayjs().format('MM/DD/YYYY');

const querySlice = createSlice({
    name: 'query',
    initialState: { 'queryString': "",
                    'queryList': "",
                    'negatedQueryList': "", 
                    'platform': "Choose a Platform", 
                    'startDate': startDate, 
                    'endDate': endDate, 
                    'collections': [{ 'id': 34412234, 'name': "United States - National" }], 
                    'sources':[]},
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
        setQueryList: (state, { payload }) => {
            state.queryList = payload;
        },
        setNegatedQueryList: (state, { payload }) => {
            state.negatedQueryList = payload;
        },
        setPlatform: (state, { payload }) => {
            state.platform = payload;
        }
    },
});

export const { 
    addSelectedMedia, 
    removeSelectedMedia,
    setStartDate,
    setEndDate,
    setQueryString,
    setQueryList,
    setNegatedQueryList,
    setPlatform } = querySlice.actions;

export default querySlice.reducer;