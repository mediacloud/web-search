import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getCookie } from '../../services/csrfToken';

// const initialState = { isLoggedIn: false };

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/auth/',
    prepareHeaders: (headers) => {
      const token = getCookie('csrftoken');
      if (token) {
        headers.set('X-CSRFToken', token);
      }
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
        body: { ...credentials },
      }),
    }),
    register: builder.mutation({
      query: (credentials) => ({
        url: 'register',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
    emailExists: builder.query({
      query: (email) => ({
        url: `email-exists?email=${email}`,
        method: 'GET',
      }),
    }),
    resetPassword: builder.mutation({
      query: (credentials) => ({
        url: 'reset-password',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
    deleteUser: builder.mutation({
      query: () => ({
        url: 'delete-user',
        method: 'DELETE',
      }),
    }),
    passwordStrength: builder.mutation({
      query: (credentials) => ({
        url: 'password-strength',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
    resetToken: builder.mutation({
      query: () => ({
        url: 'reset-token',
        method: 'POST',
      }),
    }),
    getUserQuotas: builder.query({
      query: () => ({
        url: 'users-quotas',
      }),
    }),
    requestResetCodeEmail: builder.mutation({
      query: (credentials) => ({
        url: 'request-reset',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
    emailConfirmed: builder.mutation({
      query: (token) => ({
        url: 'email-confirmed',
        method: 'POST',
        body: { ...token },
      }),
    }),
  }),
});

export const {
  useLogoutMutation,
  useLoginMutation,
  useRegisterMutation,
  useEmailExistsQuery,
  useResetPasswordMutation,
  useDeleteUserMutation,
  usePasswordStrengthMutation,
  useResetTokenMutation,
  useGetUserQuotasQuery,
  useRequestResetCodeEmailMutation,
  useEmailConfirmedMutation,
} = api;
