import managerApi from './managerApi';
import { toSearchUrlParams } from './queryUtil';

export const feedsApi = managerApi.injectEndpoints({

  endpoints: (builder) => ({
    listFeeds: builder.query({
      query: (params) => ({
        url: `feeds/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
    }),
    listFeedDetails: builder.query({
      query: (params) => ({
        url: `feeds/details/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
    }),
    getFeedHistory: builder.query({
      query: (params) => ({
        url: `feeds/history/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
    }),
    getFeed: builder.query({
      query: (feedId) => ({
        url: `feeds/${feedId}/`,
        method: 'GET',
      }),
    }),
    updateFeed: builder.mutation({
      query: (params) => ({
        url: `feeds/${params.feed.id}/`,
        method: 'PATCH',
        body: params.feed,
      }),
    }),

  }),
});

export const {
  useListFeedsQuery,
  useListFeedDetailsQuery,
  useUpdateFeedMutation,
  useGetFeedQuery,
  useGetFeedHistoryQuery,
} = feedsApi;
