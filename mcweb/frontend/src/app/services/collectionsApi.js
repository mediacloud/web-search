import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const collectionsApi = createApi({
  reducerPath: 'collectionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/sources/collections/',
    prepareHeaders: (headers, { getState }) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),
  tagTypes: ['Collection'],
  endpoints: (builder) => ({
    getFeaturedCollections: builder.query({
      query: () => ({
        url:'',
        method: 'GET'
      })
    }),
    getCollection: builder.query({
      query: (id) => ({
        url: `${id}/`,
        method: 'GET'
      }),
      providesTags: (result, error, id) =>
        result 
          ? [{type: 'Collection', id}]
          : ['Collection']
    }),
    createCollection: builder.mutation({
      query: (collection) => ({
        url: '',
        method: 'POST',
        body: { ...collection }
      })
    }),
    updateCollection: builder.mutation({
      query: (collection) => ({
        url: `/${collection.id}/`,
        method: 'PATCH',
        body: { ... collection }
      })
    }),
    deleteCollection: builder.mutation({
      query: ({id}) => ({
        url: `/${id}/`,
        method: 'DELETE',
        body: {... id}
      }),
    }),
  })
})

export const {
  useGetFeaturedCollectionsQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation
} = collectionsApi