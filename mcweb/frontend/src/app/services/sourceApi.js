import { managerApi } from "./managerApi"

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
      query: (source) => {
        return {
          url: `sources/${source.id}/`,
        method: 'PATCH',
        body:  {...source}
      }}
    }),
    deleteSource: builder.mutation({
      query: ({ id }) => ({
        url: `sources/${id}/`,
        method: 'DELETE',
        body: { ...id }
      }),
    }),
    uploadSources: builder.mutation({
      query: (sourcesArray) => ({
        url:'/upload_sources/',
        method: 'POST',
        body: sourcesArray
      }),
      invalidatesTags: ['Source']
    }),
  })
})

export const {
  useGetSourceQuery,
  usePostSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useUploadSourcesMutation,
} = sourcesApi