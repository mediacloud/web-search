import managerApi from './managerApi';

export const PAGE_SIZE = 100;

export const sourceApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    getSource: builder.query({
      query: (id) => ({
        url: `sources/${id}/`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => (result
        ? [{ type: 'SelectedSource', id }]
        : ['SelectedSource']),
    }),
    listSources: builder.query({
      query: ({collectionId, page}) => ({
        url: `sources/?collection_id=${collectionId}&limit=${PAGE_SIZE}&offset=${PAGE_SIZE*page}`,
        method: 'GET',
      }),
    }),
    createSource: builder.mutation({
      query: (source) => ({
        url: 'sources/',
        method: 'POST',
        body: { ...source },
      }),
    }),
    updateSource: builder.mutation({
      query: (source) => ({
        url: `sources/${source.id}/`,
        method: 'PATCH',
        body: { ...source },
      }),
      invalidatesTags: ['SelectedSource'],
    }),
    deleteSource: builder.mutation({
      query: ({ id }) => ({
        url: `sources/${id}/`,
        method: 'DELETE',
        body: { ...id },
      }),
    }),
    uploadSources: builder.mutation({
      query: (data) => ({
        url: 'sources/upload_sources/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Source'],
    }),
  }),
});

export const {
  useGetSourceQuery,
  useListSourcesQuery,
  useCreateSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useUploadSourcesMutation,
} = sourceApi;
