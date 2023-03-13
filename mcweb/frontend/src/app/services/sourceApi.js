import managerApi from './managerApi';
import { toSearchUrlParams } from './queryUtil';

export const sourceApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    getSource: builder.query({
      query: (id) => ({
        url: `sources/${id}/`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => (result
        ? [{ type: 'Source', id }]
        : ['Source']),
    }),
    listSources: builder.query({
      query: (params) => ({
        url: `sources/?${toSearchUrlParams(params)}`,
        method: 'GET',
      }),
      providesTags: ({ results }) => (
        results
          ? [...results.map(({ id }) => ({ type: 'Source', id }))] : ['Source']
      ),
    }),
    createSource: builder.mutation({
      query: (source) => ({
        url: 'sources/',
        method: 'POST',
        body: { ...source },
      }),
      invalidatesTags: ['Source'],
    }),
    updateSource: builder.mutation({
      query: (source) => ({
        url: `sources/${source.id}/`,
        method: 'PATCH',
        body: { ...source },
      }),
      invalidatesTags: ['Source'],
    }),
    deleteSource: builder.mutation({
      query: (id) => ({
        url: `sources/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Source'],
    }),
    uploadSources: builder.mutation({
      query: (data) => ({
        url: 'sources/upload_sources/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Source'],
    }),
    rescrapeForFeeds: builder.mutation({
      query: (sourceId) => {
        console.log(sourceId);
        return {
          url: 'sources/rescrape-feeds/',
          method: 'POST',
          body: { source_id: sourceId },
        };
      },
    }),
  }),
});

export const {
  useGetSourceQuery,
  useListSourcesQuery,
  useLazyListSourcesQuery,
  useCreateSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useUploadSourcesMutation,
  useRescrapeForFeedsMutation,
} = sourceApi;
