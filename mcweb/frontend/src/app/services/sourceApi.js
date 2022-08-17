import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const sourceApi = createApi({
    reducerPath: 'sourceApi',
    baseQuery: fetchBaseQuery({
        baseUrl: '/api/sources/sources-collections/',
        prepareHeaders: (headers, { getState }) => {
            // Django requires this for security (cross-site forgery protection) once logged in
            headers.set('X-Csrftoken', window.CSRF_TOKEN);
            return headers;
        },
    }),

    endpoints: (builder) => ({
        getSourceAndAssociations: builder.query({
            query: (id) => ({
                url: `${id}/`,
                method: 'GET'
            }),
        }),
    })
})


export const {
    useGetSourceAndAssociationsQuery,
} = sourceApi