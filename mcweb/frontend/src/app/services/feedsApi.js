import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const feedsApi = createApi({
  reducerPath: 'feedsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://rss-fetcher.tarbell.mediacloud.org/api/',
    prepareHeaders: (headers) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),

  endpoints: (builder) => ({
    getSourceFeeds: builder.query({
      query: (sourceId) => ({
        url: `sources/${sourceId}/feeds`,
        method: 'GET',
      }),
    }),

  }),
});

export const {
  useGetSourceFeedsQuery,
} = feedsApi;
