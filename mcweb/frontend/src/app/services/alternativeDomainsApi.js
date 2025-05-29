import managerApi from './managerApi';

export const alternativeDomainsApi = managerApi.injectEndpoints({
  endpoints: (builder) => ({
    createAlternativeDomain: builder.mutation({
      query: (payload) => ({
        url: 'alternative-domains/',
        method: 'POST',
        body: { source_id: payload.source_id, alternative_domain: payload.alternative_domain },
      }),
      invalidatesTags: ['Source'],
    }),
    deleteAlternativeDomain: builder.mutation({
      query: (ids) => ({
        url: `alternative-domains/${ids}/`,
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
