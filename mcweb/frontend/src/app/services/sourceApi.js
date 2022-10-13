import { managerApi } from "./managerApi";

export const sourcesApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    getSource: builder.query({
      query: (id) => ({
        url: `sources/${id}/`,
        method: 'GET'
      }),
      providesTags: (result, error, id) =>
        result
          ? [{ type: 'Source', id }]
          : ['Source']
    }),
    postSource: builder.mutation({
      query: (source) => ({
        url: 'sources/',
        method: 'POST',
        body: { ...source }
      })
    }),
    updateSource: builder.mutation({
      query: (source) => ({
        url: `sources/${source.id}/`,
        method: 'PATCH',
        body:  {...source}
      })
    }),
    deleteSource: builder.mutation({
      query: ({ id }) => ({
        url: `sources/${id}/`,
        method: 'DELETE',
        body: { ...id }
      }),
    }),
    uploadSources: builder.mutation({
      query: (data) => ({
        url:'sources/upload_sources/',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Source']
    }),
    downloadSourceCSV: builder.query({
      query: (collectionId) => ({
        url: `sources/download_csv/?collection_id=${collectionId}`,
        method: 'GET',
        responseHandler: async (response) => window.location.assign(window.URL.createObjectURL(await response.blob())),
      }),
    }),
  })
});

export const {
  useGetSourceQuery,
  usePostSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useUploadSourcesMutation,
  useDownloadSourceCSVQuery,
} = sourcesApi;