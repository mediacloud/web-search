import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/search/',
    prepareHeaders: (headers) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),

  endpoints: (builder) => ({
    getSearch: builder.mutation({
      query: (credentials) => ({
        url: 'search',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
    getTotalCount: builder.mutation({
      query: (queryObject) => ({
        url: 'total-count',
        method: 'POST',
        body: { queryObject },
      }),
    }),
    getCountOverTime: builder.mutation({
      query: (queryObject) => ({
        url: 'count-over-time',
        method: 'POST',
        body: { queryObject },
      }),
    }),
    getSampleStories: builder.mutation({
      query: (queryObject) => ({
        url: 'sample',
        method: 'POST',
        body: { queryObject },
      }),
    }),
    getStoryDetails: builder.query({
      query: (storyId) => ({
        url: `story?storyId=${storyId}`,
        method: 'GET',
      }),
    }),
    getTopWords: builder.mutation({
      query: (queryObject) => ({
        url: 'words',
        method: 'POST',
        body: { queryObject },
      }),
    }),
    getTopLanguages: builder.mutation({
      query: (queryObject) => ({
        url: 'languages',
        method: 'POST',
        body: { queryObject },
      }),
    }),
    createSavedSearch: builder.mutation({
      query: (savedsearch) => ({
        url: 'savedsearch/',
        method: 'POST',
        body: { savedsearch },
      }),
      invalidatesTags: ['SavedSearch'],
    }),
    getSavedSearch: builder.query({
      query: (id) => ({
        url: `savedsearch/${id}/`,
        method: 'GET',
      }),
      providesTags: (result, id) => (result
        ? [{ type: 'SavedSearch', id }]
        : ['SavedSearch']),
    }),
    listSavedSearches: builder.query({
      query: () => ({
        url: 'savedsearch/',
        method: 'GET',
      }),
      providesTags: (result, id) => (result
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
      query: (savedsearch) => ({
        url: `savedsearch/${savedsearch.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SavedSearch'],
    }),
  }),
});

// search/attentionOverTime
// search
// action: get back Json. Save it to searchResults
export const {
  useGetSearchMutation,
  useGetTotalCountMutation,
  useGetCountOverTimeMutation,
  useGetSampleStoriesMutation,
  useGetStoryDetailsQuery,
  useGetTopWordsMutation,
  useGetTopLanguagesMutation,
  useCreateSavedSearchMutation,
  useGetSavedSearchQuery,
  useListSavedSearchesQuery,
  useUpdateSavedSearchMutation,
  useDeleteSavedSearchMutation,
} = searchApi;
