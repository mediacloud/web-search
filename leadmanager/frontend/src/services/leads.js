import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

<<<<<<< HEAD:leadmanager/frontend/src/services/leadsApi.js
export const leadsApiSlice = createApi({
    reducerPath: 'leads',
    baseQuery: fetchBaseQuery({ baseUrl: '/api/leads' }),
=======
export const leadsApi = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:8000/api/' }),
>>>>>>> 9309a066aeb15de4337e581541dce9c4854c8517:leadmanager/frontend/src/services/leads.js
    prepareHeaders: (headers, { getState }) => {
        // Django requires this for security (cross-site forgery protection) once logged in
        headers.set(' X-CSRFToken', window.CSRF_TOKEN);
        return headers;
    },
    tagTypes: ['Leads'],
    endpoints: (builder) => ({

        getLeads: builder.query({
            query: () => '',
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
<<<<<<< HEAD:leadmanager/frontend/src/services/leadsApi.js
} = leadsApiSlice;
=======
} = leadsApi


export const cookieApi = createApi ({
    
})
>>>>>>> 9309a066aeb15de4337e581541dce9c4854c8517:leadmanager/frontend/src/services/leads.js
