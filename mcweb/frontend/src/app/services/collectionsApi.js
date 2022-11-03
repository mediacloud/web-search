import managerApi from './managerApi';

export const collectionsApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeaturedCollections: builder.query({
      query: () => ({
        url: 'collections/',
        method: 'GET',
      }),
    }),
    getCollection: builder.query({
      query: (id) => ({
        url: `collections/${id}/`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => (result
        ? [{ type: 'Collection', id }]
        : ['Collection']),
    }),
    createCollection: builder.mutation({
      query: (collection) => ({
        url: 'collections/',
        method: 'POST',
        body: { ...collection },
      }),
    }),
    updateCollection: builder.mutation({
      query: (collection) => ({
        url: `collections/${collection.id}/`,
        method: 'PATCH',
        body: { ...collection },
      }),
    }),
    deleteCollection: builder.mutation({
      query: ({ id }) => ({
        url: `collections/${id}/`,
        method: 'DELETE',
        body: { ...id },
      }),
    }),
  }),
});

export const {
  useGetFeaturedCollectionsQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
<<<<<<< HEAD
  useLazyGetCollectionQuery,
} = collectionsApi;
=======
} = collectionsApi;
>>>>>>> main
