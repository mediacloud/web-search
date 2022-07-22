import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const searchApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/auth/',
    prepareHeaders: (headers, { getState }) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),

  endpoints: (builder) => ({
    getSearch: builder.mutation({
      query: (credentials) => ({
        url: 'search',
        method: 'POST',
        body: { ...credentials }
      }),
    }),
  }),
})


// search/attentionOverTime 
// search
// action: get back Json. Save it to searchResults
export const {
  useGetSearchMutation,
} = searchApi