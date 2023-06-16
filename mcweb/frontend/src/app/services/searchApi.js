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
      query: ({ storyId, platform }) => ({
        url: `/story?storyId=${storyId}&platform=${platform}`,
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
    sendTotalAttentionDataEmail: builder.mutation({
      query: (preparedQueryAndEmail) => ({
        url: 'send-email-large-download-csv',
        method: 'POST',
        body: { ...preparedQueryAndEmail },
      }),
    }),
  }),
});

export const {
  useGetSearchMutation,
  useGetTotalCountMutation,
  useGetCountOverTimeMutation,
  useGetSampleStoriesMutation,
  useGetStoryDetailsQuery,
  useGetTopWordsMutation,
  useGetTopLanguagesMutation,
  useSendTotalAttentionDataEmailMutation,
} = searchApi;
