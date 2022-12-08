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
      query: ({name, sourceId, page}) => {
        const queryParams = {
          limit: PAGE_SIZE,
          offset: page ? PAGE_SIZE*page : 0,
        }; // need to make sure we don't send any "undefined"s to server
        if (name) {
          queryParams.name = name;
        }
        if (sourceId) {
          queryParams.sourceId = sourceId;
        }
        if (page) {
          queryParams.page = page;
        }
        return {
          url: `collections/?${(new URLSearchParams(queryParams)).toString()}`,
          method: 'GET',
        };
      },
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
        ? [{ type: 'SelectedCollection', id }]
        : ['SelectedCollection']),
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
      invalidatesTags: ['SelectedCollection'],
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
  useLazyListCollectionsQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useLazyGetCollectionQuery,
  useGetGlobalCollectionsQuery,
} = collectionsApi;
