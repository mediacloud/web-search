import managerApi from './managerApi';

export const feedsApi = managerApi.injectEndpoints({

  endpoints: (builder) => ({
    getSourceFeeds: builder.mutation({
      query: (sourceId) => ({
        url: '/feeds/sources_feeds/',
        method: 'POST',
        body: { source_id: sourceId },
      }),
    }),

  }),
});

export const {
  useGetSourceFeedsMutation,
} = feedsApi;
