import managerApi from './managerApi';
import { toSearchUrlParams } from './queryUtil';

export const feedsApi = managerApi.injectEndpoints({

  endpoints: (builder) => ({
    listFeeds: builder.query({
      query: (params) => ({
        url: `feeds/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => (result.results
        ? [{ type: 'Feed', id }]
        : ['Feed']),
    }),
    listFeedDetails: builder.query({
      query: (params) => ({
        url: `feeds/details/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
    }),
    listFeedStories: builder.query({
      query: (params) => ({
        url: `feeds/feed-stories/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
    }),
    getFeedHistory: builder.query({
      query: (params) => ({
        url: `feeds/history/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
    }),
    getFeedDetails: builder.query({
      query: (params) => ({
        url: `feeds/feed-details/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
    }),
    getFeed: builder.query({
      query: (feedId) => ({
        url: `feeds/${feedId}/`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => (result
        ? [{ type: 'Feed', id }]
        : ['Feed']),
    }),
    updateFeed: builder.mutation({
      query: (params) => ({
        url: `feeds/${params.feed.id}/`,
        method: 'PATCH',
        body: params.feed,
      }),
      invalidatesTags: ['Feed'],
    }),
    fetchFeed: builder.query({
      query: (params) => ({
        url: `feeds/fetch/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
      invalidatesTags: ['Feed'],
    }),
    createFeed: builder.mutation({
      query: (params) => ({
        url: 'feeds/',
        method: 'POST',
        body: params,
      }),
      invalidatesTags: ['Feed'],
    }),
    deleteFeed: builder.mutation({
      query: (feedId) => ({
        url: `feeds/${feedId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Feed'],
    }),
  }),
});

export const {
  useListFeedsQuery,
  useListFeedDetailsQuery,
  useUpdateFeedMutation,
  useGetFeedQuery,
  useGetFeedHistoryQuery,
  useGetFeedDetailsQuery,
  useLazyFetchFeedQuery,
  useCreateFeedMutation,
  useDeleteFeedMutation,
  useListFeedStoriesQuery,
} = feedsApi;
