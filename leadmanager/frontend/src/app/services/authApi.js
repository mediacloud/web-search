import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const initialState = { isLoggedIn: false };

export const api = createApi({
  //baseQuery: fetchBaseQuery({ baseUrl: '/api/auth' }),
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/auth',
    prepareHeaders: (headers, { getState }) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),

  endpoints: (builder) => ({
    profile: builder.query({
      query: () => 'profile',
    }),
    logout: builder.mutation({
      query: () => ({
        url: 'logout',
        method: 'POST',
      }),
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: 'login',
        method: 'POST',
        body: { ...credentials }
      }),
    }),
    register: builder.mutation({
      query: (credentials) => ({
        url: 'register',
        method: 'POST',
        body: { ...credentials }
      }),
    }),
  })
})

export const {
  useProfileQuery,
  useLogoutMutation,
  useLoginMutation,
  useRegisterMutation
} = api;
