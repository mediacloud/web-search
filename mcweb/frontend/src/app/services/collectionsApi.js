import managerApi from './managerApi';

export const PAGE_SIZE = 100;

export const collectionsApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeaturedCollections: builder.query({
      query: () => ({
        url: 'collections/featured/',
        method: 'GET',
      }),
    }),
    listCollections: builder.query({
      query: ({sourceId, page}) => ({
        url: `collections/?source_id=${sourceId}&limit=${PAGE_SIZE}&offset=${PAGE_SIZE*page}`,
        method: 'GET',
      }),
    }),
    searchCollections: builder.query({
      query: (queryString) => ({
        url: `collections/search/?query=${queryString}`,
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
  useListCollectionsQuery,
  useLazySearchCollectionsQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useLazyGetCollectionQuery,
} = collectionsApi;
