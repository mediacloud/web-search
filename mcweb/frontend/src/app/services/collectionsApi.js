import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const collectionsApi = createApi({
  reducerPath: 'collectionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/sources-collections/',
    prepareHeaders: (headers, { getState }) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),

  endpoints: (builder) => ({

    getCollection: builder.query({
      query: (collectionID) =>
        '/${collectionID}/?collection=true'
    }),
    postCollection: builder.mutation({
      query: (collection) => ({
        // url is already '/api/sources-collections/'
        method: 'POST',
        body: { ...collection }
      })
    }),
    updateCollection: builder.mutation({
      query: (collectionID) => ({
        url: '/${collectionID}/?collection=true',
        method: 'PATCH',
        body: { ...collectionID }
      })
    }),
    deleteCollection: builder.mutation({
      query: (collectionID, sourceID) => ({
        url: '/${collectionID}/collection=true&source_id=${sourceID}/',
        method: 'DELETE',
        body: { collectionID, sourceID }
      }),
    }),
  })
})

export const {
  useGetCollectionQuery,
  usePostCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation

} = collectionsApi