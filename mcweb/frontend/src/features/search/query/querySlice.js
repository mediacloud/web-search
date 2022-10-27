import { createSlice, current } from '@reduxjs/toolkit';
import dayjs from 'dayjs';

const startDate = dayjs().subtract(34, 'day').format('MM/DD/YYYY');
const endDate = dayjs().subtract(4, 'day').format('MM/DD/YYYY');

const querySlice = createSlice({
    name: 'query',
    initialState: { 'queryString': "",
                    'queryList': [[],[],[]],
                    'negatedQueryList': [[],[],[]],
                    'platform': "onlinenews", // "Choose a Platform", 
                    'startDate': startDate,
                    'endDate': endDate,
                    'collections': [{ 'id': 34412234, 'name': "United States - National" }],
                    'previewCollections': [{ 'id': 34412234, 'name': "United States - National" }],
                    'sources':[],
                    'lastSearchTime': dayjs().format(),
                    'anyAll': "any"
                },

    reducers: {
        addSelectedMedia: (state, {payload}) => {
            state.collections = payload;
        },
        removeSelectedMedia: (state, {payload}) => {
            state.collections = state.collections.filter(collection => collection.id !== payload);
            state.previewCollections = state.previewCollections.filter(collection => collection.id !== payload);

        },
        addPreviewSelectedMedia: (state, { payload }) => {
            state.previewCollections.push(payload);
        },
        removePreviewSelectedMedia: (state, { payload }) => {
            state.previewCollections = state.previewCollections.filter(collection => collection.id !== payload);
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
        },
        setSearchTime: (state, {payload}) => {
            state.lastSearchTime = payload;
        },
        setAnyAll: (state, {payload}) => {
            state.anyAll = payload;
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
    setPlatform,
    setSearchTime,
    addPreviewSelectedMedia,
    removePreviewSelectedMedia,
    setAnyAll,
    } = querySlice.actions;

export default querySlice.reducer;
