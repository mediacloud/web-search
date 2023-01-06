import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: 'auth/',
    prepareHeaders: (headers) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),

  endpoints: (builder) => ({
    resetPassword: builder.mutation({
      query: (credentials) => ({
        url: '/users/reset_password/',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
  }),
});

export const {
  useResetPasswordMutation,
} = api;
