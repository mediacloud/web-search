import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const sourcesCollectionsApi = createApi({
    reducerPath: 'sourcesCollectionsApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/sources/sources-collections/',
        prepareHeaders: (headers, { getState }) => {
            // Django requires this for security (cross-site forgery protection) once logged in
            headers.set('X-Csrftoken', window.CSRF_TOKEN);
            return headers;
        },
    }),
    tagTypes: ['Source', 'Collection'],
    endpoints: (builder) => ({
        getSourceAndAssociations: builder.query({
            query: (id) => ({
                url: `${id}/`,
                method: 'GET'
            }),
            providesTags: (result, error, collectionId) =>
                result
                    ? [...result['collections'].map(({ id }) => ({ type: 'Collection', id })), 'Collection']
                    : ['Collection']
        }),
        getCollectionAndAssociations: builder.query({
            query: (id) => ({
                url: `${id}/?collection=true`,
                method: 'GET'
            }),
            providesTags: (result, error, collectionId) =>
                result
                  ? [...result['sources'].map(({id}) => ({type: 'Source', id})), 'Source']
                  : ['Source']
        }),
        createSourceCollectionAssociation: builder.mutation({
            query: (payload) => ({
                url: ``,
                method: 'POST',
                body: {'source_id': payload.source_id, 'collection_id': payload.collection_id}
            }),
            invalidatesTags: (result, error, ids) =>
                [{ type: 'Collection', id: ids.collection_id }, { type: 'Source', id: ids.source_id }],
                
        }),
        deleteSourceCollectionAssociation: builder.mutation({
            query: (ids) => ({
                url:`${ids.source_id}/?collection_id=${ids.collection_id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, error, ids) => 
                [{ type: 'Collection', id: ids.collection_id }, { type: 'Source', id: ids.source_id }],
        })
    })
})


export const {
    useGetSourceAndAssociationsQuery,
    useGetCollectionAndAssociationsQuery,
    useCreateSourceCollectionAssociationMutation,
    useDeleteSourceCollectionAssociationMutation
} = sourcesCollectionsApi