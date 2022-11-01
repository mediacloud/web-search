import managerApi from './managerApi';

export const sourcesCollectionsApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    getSourceAssociations: builder.query({
      query: (id) => ({
        url: `sources-collections/${id}/`,
        method: 'GET',
      }),
      providesTags: (result) => (result
        ? [...result.collections.map(({ id }) => ({ type: 'Collection', id })), 'Collection']
        : ['Collection']),
    }),
    getCollectionAssociations: builder.query({
      query: (id) => ({
        url: `sources-collections/${id}/?collection=true`,
        method: 'GET',
      }),
      providesTags: (result) => (result
        ? [...result.sources.map(({ id }) => ({ type: 'Source', id })), 'Source']
        : ['Source']),
    }),
    createSourceCollectionAssociation: builder.mutation({
      query: (payload) => ({
        url: 'sources-collections/',
        method: 'POST',
        body: { source_id: payload.source_id, collection_id: payload.collection_id },
      }),
      invalidatesTags: ['Collection', 'Source'],
    }),
    deleteSourceCollectionAssociation: builder.mutation({
      query: (ids) => ({
        url: `sources-collections/${ids.source_id}/?collection_id=${ids.collection_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, ids) => [{ type: 'Collection', id: ids.collection_id }, { type: 'Source', id: ids.source_id }],
    }),
  }),
});

export const {
  useGetSourceAssociationsQuery,
  useGetCollectionAssociationsQuery,
  useCreateSourceCollectionAssociationMutation,
  useDeleteSourceCollectionAssociationMutation,
} = sourcesCollectionsApi;
