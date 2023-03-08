import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const savedsearchApi = createApi({
  reducerPath: 'savedsearchApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/savedsearch/',
    prepareHeaders: (headers) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),
  tagTypes: ['SavedSearch'],

  endpoints: (builder) => ({
    createSavedSearch: builder.mutation({
      query: (savedsearch) => ({
        url: 'savedsearch/',
        method: 'POST',
        body: { ...savedsearch },
      }),
      invalidatesTags: ['SavedSearch'],
    }),
    getSavedSearch: builder.query({
      query: (id) => ({
        url: `savedsearch/${id}/`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => (result
        ? [{ type: 'SavedSearch', id }]
        : ['SavedSearch']),
    }),
    listSavedSearches: builder.mutation({
      query: () => ({
        url: 'savedsearch/',
        method: 'GET',
      }),
      providesTags: (result, error, id) => (result
        ? [{ type: 'SavedSearch', id }]
        : ['SavedSearch']),
    }),
    updateSavedSearch: builder.mutation({
      query: (savedsearch) => ({
        url: `savedsearch/${savedsearch.id}`,
        method: 'PATCH',
        body: { ...savedsearch },
      }),
      invalidatesTags: ['SavedSearch'],
    }),
    deleteSavedSearch: builder.mutation({
      query: (savedsearchId) => ({
        url: `savedsearch/${savedsearchId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SavedSearch'],
    }),
  }),
});

export const {
  useCreateSavedSearchMutation,
  useGetSavedSearchQuery,
  useListSavedSearchesQuery,
  useUpdateSavedSearchMutation,
  useDeleteSavedSearchMutation,
} = savedsearchApi;
