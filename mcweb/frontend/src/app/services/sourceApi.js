import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const sourcesApi = createApi({
  reducerPath: 'sourcesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/sources/sources/',
    prepareHeaders: (headers, { getState }) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),
  tagTypes: ['Source'],
  endpoints: (builder) => ({
    getSource: builder.query({
      query: (id) => ({
        url: `${id}/`,
        method: 'GET'
      }),
      providesTags: (result, error, id) =>
        result
          ? [{ type: 'Source', id }]
          : ['Source']
    }),
    postSource: builder.mutation({
      query: (source) => ({
        url: '',
        method: 'POST',
        body: { ...source }
      })
    }),
    updateSource: builder.mutation({
      query: (source) => {
        return {
        url: `/${source.id}/`,
        method: 'PATCH',
        body:  {...source}
      }}
    }),
    deleteSource: builder.mutation({
      query: ({ id }) => ({
        url: `/${id}/`,
        method: 'DELETE',
        body: { ...id }
      }),
    }),
    uploadSources: builder.mutation({
      query: (sourcesArray) => ({
        url:'/upload_sources/',
        method: 'POST',
        body: sourcesArray
      }),
    }),
  })
})

export const {
  useGetSourceQuery,
  usePostSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useUploadSourcesMutation,
} = sourcesApi