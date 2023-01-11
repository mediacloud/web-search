import managerApi from './managerApi';

export const sourcesCollectionsApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
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
  useCreateSourceCollectionAssociationMutation,
  useDeleteSourceCollectionAssociationMutation,
} = sourcesCollectionsApi;
