import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:8000/api/' }),
    prepareHeaders: (headers, { getState }) => {
        // Django requires this for security (cross-site forgery protection) once logged in
        headers.set(' X-CSRFToken', window.CSRF_TOKEN);
        return headers;
    },
    tagTypes: ['Leads'],
    endpoints: (builder) => ({

        getLeads: builder.query({
            query: () => 'leads',
            transformResponse: res => res.sort((a, b) => b.id - a.id),
            providesTags: ['Leads']
        }),

        addLead: builder.mutation({
            query: (lead) => ({
                url: 'leads',
                method: 'POST',
                body: lead
            }),
            invalidatesTags: ['Leads']
        }),
        updateLead: builder.mutation({
            query: (lead) => ({
                url: `leads/${lead.id}`,
                method: 'PATCH',
                body: lead
            }),
            invalidatesTags: ['Leads']
        }),
        deleteLead: builder.mutation({
            query: ({ id }) => ({
                url: `leads/${id}`,
                method: 'DELETE',
                body: id
            }),
            invalidatesTags: ['Leads']
        }),
    })
})

export const {
    useGetLeadsQuery,
    useAddLeadMutation,
    useUpdateLeadMutation,
    useDeleteLeadMutation
} = apiSlice