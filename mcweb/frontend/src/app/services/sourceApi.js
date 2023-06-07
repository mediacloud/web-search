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
    listSourcesFromArray: builder.query({
      query: (params) => ({
        url: `sources/sources-from-list/?s=${params}`,
        method: 'GET',
      }),
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
      query: (sourceId) => ({
        url: 'sources/rescrape-feeds/',
        method: 'POST',
        body: { source_id: sourceId },
      }),
    }),
    getPendingTasks: builder.query({
      query: () => ({
        url: 'sources/pending-tasks/',
        method: 'GET',
      }),
    }),
    getCompletedTasks: builder.query({
      query: () => ({
        url: 'sources/completed-tasks/',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetSourceQuery,
  useListSourcesQuery,
  useLazyListSourcesQuery,
  useListSourcesFromArrayQuery,
  useCreateSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useUploadSourcesMutation,
  useRescrapeForFeedsMutation,
  useGetPendingTasksQuery,
  useGetCompletedTasksQuery,
} = sourceApi;
