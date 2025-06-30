import managerApi from './managerApi';

export const alternativeDomainsApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    createAlternativeDomain: builder.mutation({
      query: (payload) => ({
        url: 'alternative-domains/',
        method: 'POST',
        body: { ...payload },
      }),
      invalidatesTags: ['Source'],
    }),
    deleteAlternativeDomain: builder.mutation({
      query: (id) => ({
        url: `alternative-domains/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Source'],
    }),
  }),
});

export const {
  useCreateAlternativeDomainMutation,
  useDeleteAlternativeDomainMutation,
} = alternativeDomainsApi;
