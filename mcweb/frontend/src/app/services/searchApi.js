import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const TIMEOUT_CONST_MS = 5;

const timeoutAction = (fetchFunc) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(fetchFunc);
  }, TIMEOUT_CONST_MS);
});

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
      queryFn: (queryState, _queryApi, _extraOptions, fetchWithBQ) => {
        const promises = queryState.map((queryObject) => timeoutAction(fetchWithBQ({
          url: 'total-count',
          method: 'POST',
          body: { queryObject },
        })));
        return Promise.all(promises).then(
          (results) => (
            results[0].data
              ? { data: results.map((result) => (result.data)) }
              : { error: results[0].error.data }),
        );
      },
    }),
    getCountOverTime: builder.mutation({
      queryFn: (queryState, _queryApi, _extraOptions, fetchWithBQ) => {
        const promises = queryState.map((queryObject) => timeoutAction(fetchWithBQ({
          url: 'count-over-time',
          method: 'POST',
          body: { queryObject },
        })));
        return Promise.all(promises).then(
          (results) => (
            results[0].data
              ? { data: results.map((result) => (result.data)) }
              : { error: results[0].error.data }),
        );
      },
    }),
    getSampleStories: builder.mutation({
      queryFn: (queryState, _queryApi, _extraOptions, fetchWithBQ) => {
        const promises = queryState.map((queryObject) => timeoutAction(fetchWithBQ({
          url: 'sample',
          method: 'POST',
          body: { queryObject },
        })));
        return Promise.all(promises).then(
          (results) => (
            results[0].data
              ? { data: results.map((result) => (result.data)) }
              : { error: results[0].error.data }),
        );
      },
    }),
    getStoryDetails: builder.query({
      query: ({ storyId, platform }) => ({
        url: `/story?storyId=${storyId}&platform=${platform}`,
        method: 'GET',
      }),
    }),
    getTopWords: builder.mutation({
      queryFn: (queryState, _queryApi, _extraOptions, fetchWithBQ) => {
        const promises = queryState.map((queryObject) => timeoutAction(fetchWithBQ({
          url: 'words',
          method: 'POST',
          body: { queryObject },
        })));
        return Promise.all(promises).then(
          (results) => (
            results[0].data
              ? { data: results.map((result) => (result.data)) }
              : { error: results[0].error.data }),
        );
      },
    }),
    getTopLanguages: builder.mutation({
      queryFn: (queryState, _queryApi, _extraOptions, fetchWithBQ) => {
        const promises = queryState.map((queryObject) => timeoutAction(fetchWithBQ({
          url: 'languages',
          method: 'POST',
          body: { queryObject },
        })));
        return Promise.all(promises).then(
          (results) => (results[0].data
            ? { data: results.map((result) => (result.data)) }
            : { error: results[0].error.data }),
        );
      },
    }),
    getTopSources: builder.mutation({
      queryFn: (queryState, _queryApi, _extraOptions, fetchWithBQ) => {
        const promises = queryState.map((queryObject) => timeoutAction(fetchWithBQ({
          url: 'sources',
          method: 'POST',
          body: { queryObject },
        })));
        return Promise.all(promises).then(
          (results) => (
            results[0].data
              ? { data: results.map((result) => (result.data)) }
              : { error: results[0].error.data }),
        );
      },
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
  useGetTopSourcesMutation,
} = searchApi;
