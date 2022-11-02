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
    getCollectionSearch: builder.query({
      query: (queryString) => ({
        url: `collections/?query=${queryString}`,
        method: 'GET',
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
    downloadCountsOverTimeCSV: builder.mutation({
      query: (queryObject) => ({
        url: 'download-counts-over-time',
        method: 'POST',
        body: { queryObject },
        responseHandler: async (response) => (
        // const downloadLink = window.URL.createObjectURL(await response.blob());
        // const titledLink = await downloadLink.setAttribute("download",
        // 'count-over-time-csv.csv');
        // console.log(await response.blob());
        // console.log(URL.createObjectURL(await response.blob()));
        // return await window.location.assign(titledLink);
          window.location.assign(window.URL.createObjectURL(await response.blob()))),
      }),
    }),
    downloadSampleStoriesCSV: builder.mutation({
      query: (queryObject) => ({
        url: 'download-sample-stories',
        method: 'POST',
        body: { queryObject },
        responseHandler: async (response) => (
          // const downloadLink = window.URL.createObjectURL(await response.blob());
          // const titledLink = await downloadLink.setAttribute("download",
          // 'count-over-time-csv.csv');
          // console.log(await response.blob());
          // console.log(URL.createObjectURL(await response.blob()));
          // return await window.location.assign(titledLink);
          window.location.assign(window.URL.createObjectURL(await response.blob()))),

      }),
    }),
  }),
});

// search/attentionOverTime
// search
// action: get back Json. Save it to searchResults
export const {
  useGetSearchMutation,
  useLazyGetCollectionSearchQuery,
  useGetTotalCountMutation,
  useGetCountOverTimeMutation,
  useGetSampleStoriesMutation,
  useDownloadCountsOverTimeCSVMutation,
  useDownloadSampleStoriesCSVMutation
} = searchApi;
