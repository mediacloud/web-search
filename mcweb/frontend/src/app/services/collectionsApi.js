import managerApi from './managerApi';

export const collectionsApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeaturedCollections: builder.query({
      query: () => ({
        url: 'collections/featured/',
        method: 'GET',
      }),
    }),
    searchCollections: builder.query({
      query: (queryString) => ({
        url: `collections/search/?query=${queryString}`,
        method: 'GET',
      }),
    }),
    getGlobalCollections: builder.query({
      query: () => ({
        url: 'collections/geo_collections/',
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
  useLazySearchCollectionsQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useLazyGetCollectionQuery,
  useGetGlobalCollectionsQuery,
} = collectionsApi;
