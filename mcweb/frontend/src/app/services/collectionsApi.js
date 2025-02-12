import managerApi from './managerApi';
import { toSearchUrlParams } from './queryUtil';

export const collectionsApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeaturedCollections: builder.query({
      query: (params) => ({
        url: `collections/featured/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
      providesTags: ({ collections }) => (collections
        ? [...collections.map(({ id }) => ({ type: 'Collection', id }))] : ['Collection']),
    }),
    listCollectionsFromArray: builder.query({
      query: (params) => ({
        url: `collections/collections-from-list/?c=${params}`,
        method: 'GET',
      }),
    }),
    listCollectionsFromNestedArray: builder.query({
      query: (params) => ({
        url: `collections/collections-from-nested-list/?${toSearchUrlParams(params, true)}`,
        method: 'GET',
      }),
    }),
    listCollections: builder.query({
      query: (params) => ({
        url: `collections/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
      providesTags: ({ results }) => (results
        ? [...results.map(({ id }) => ({ type: 'Collection', id }))] : ['Collection']),
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
      invalidatesTags: ['Collection'],
    }),
    updateCollection: builder.mutation({
      query: (collection) => ({
        url: `collections/${collection.id}/`,
        method: 'PATCH',
        body: { ...collection },
      }),
      invalidatesTags: ['Collection'],
    }),
    deleteCollection: builder.mutation({
      query: (id) => ({
        url: `collections/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Collection'],
    }),
    copyCollection: builder.mutation({
      query: (collection) => ({
        url: 'collections/copy-collection/',
        method: 'POST',
        body: { collection_id: collection.id, name: collection.name },
      }),
      invalidatesTags: ['Collection'],
    }),
    rescrapeCollection: builder.mutation({
      query: (collectionId) => ({
        url: 'collections/rescrape-collection/',
        method: 'POST',
        body: { collection_id: collectionId },
      }),
    }),
  }),
});

export const {
  useGetFeaturedCollectionsQuery,
  useListCollectionsQuery,
  useLazyListCollectionsQuery,
  useListCollectionsFromArrayQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useCopyCollectionMutation,
  useDeleteCollectionMutation,
  useLazyGetCollectionQuery,
  useGetGlobalCollectionsQuery,
  useRescrapeCollectionMutation,
  useLazyListCollectionsFromNestedArrayQuery,
} = collectionsApi;
