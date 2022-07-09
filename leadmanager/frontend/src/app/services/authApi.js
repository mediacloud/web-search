import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


// Plan:

// When user clicks logout, it hits the userApi.js
// calls urls.py to talk to django admin


const initialState = { isLoggedIn: false };

export const api = createApi({
  //baseQuery: fetchBaseQuery({ baseUrl: '/api/auth' }),
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/auth',
    prepareHeaders: (headers, { getState }) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-CSRFToken', window.CSRF_TOKEN);
      return headers;
    },
  }),

  endpoints: (builder) => ({
    profile: builder.query({
      query: () => 'profile',
    }),
    logout: builder.mutation({
      query: () => 'logout',
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        body: { ...credentials, csrfmiddlewaretoken: window.CSRF_TOKEN }
      }),
    }),
  })
})

export const {
  useProfileQuery,
  useLogoutMutation,
  useLoginMutation,
} = api;
