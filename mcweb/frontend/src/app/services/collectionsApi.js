import managerApi from './managerApi';
import { toSearchUrlParams } from './queryUtil';

export const collectionsApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeaturedCollections: builder.query({
      query: (params) => ({
        url: `collections/featured/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
    }),
    listCollections: builder.query({
      query: (params) => ({
          url: `collections/?${toSearchUrlParams(params)}`,
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
