import { createSlice } from '@reduxjs/toolkit';

const sourcesCollectionsSlice = createSlice({
    name: 'sourcesCollections',
    initialState: {},
    reducers: {
        setSourceCollectionsAssociations: (state, { payload }) => {
            return payload.collections.map(collection => (
                [{'collection_id':collection.id,'source_id':payload.sources.id} ]
            ))
        },
        setCollectionSourcesAssociations: (state, { payload }) => {
            return payload.sources.map(source => (
                [{ 'collection_id': payload.collections.id, 'source_id': source.id }]
            ))
        },
        setSourceCollectionAssociation: (state, {payload}) => {
            console.log(payload)
            state.push([{'collection_id': payload.collection_id, 'source_id': payload.source_id}])
        }
    },
});

export const setSourceCollectionsAssociations = sourcesCollectionsSlice.actions.setSourceCollectionsAssociations
export const setCollectionSourcesAssociations = sourcesCollectionsSlice.actions.setCollectionSourcesAssociations
export const setSourceCollectionAssociation = sourcesCollectionsSlice.actions.setSourceCollectionAssociation


export default sourcesCollectionsSlice.reducer;