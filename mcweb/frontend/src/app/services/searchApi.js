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
    getTotalCount: builder.mutation({
      // query: (queryObject) => ({
      //   url: 'total-count',
      //   method: 'POST',
      //   body: { queryObject },
      // }),
      queryFn: (queryState, _queryApi, _extraOptions, fetchWithBQ) => {
        const promises = queryState.map((queryObject) => fetchWithBQ({
          url: 'total-count',
          method: 'POST',
          body: { queryObject },
        }));
        return Promise.all(promises).then((results) => ({ data: results.map((result) => (result.data)) }));
      },
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
  useGetTotalCountMutation,
  useGetCountOverTimeMutation,
  useGetSampleStoriesMutation,
  useGetStoryDetailsQuery,
  useGetTopWordsMutation,
  useGetTopLanguagesMutation,
  useSendTotalAttentionDataEmailMutation,
} = searchApi;
