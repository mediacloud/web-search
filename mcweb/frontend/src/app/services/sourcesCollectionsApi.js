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
    createManySCAssociations: builder.mutation({
      query: (payload) => ({
        url: 'sources-collections/many-assoc',
        method: 'POST',
        body: { source_ids: payload.source_id, collection_id: payload.collection_id },
      }),
      invalidatesTags: ['Collection', 'Source'],
    }),
    deleteSourceCollectionAssociation: builder.mutation({
      query: (ids) => ({
        url: `sources-collections/${ids.source_id}/?collection_id=${ids.collection_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Collection', 'Source'],
    }),
  }),
});

export const {
  useCreateSourceCollectionAssociationMutation,
  useDeleteSourceCollectionAssociationMutation,
  useCreateManySCAssociationsMutation,
} = sourcesCollectionsApi;
