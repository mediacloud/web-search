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

  }),
});

export const {
  useListFeedsQuery,
  useListFeedDetailsQuery,
} = feedsApi;
