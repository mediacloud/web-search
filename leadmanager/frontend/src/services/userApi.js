import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


// Plan: 

// When user clicks logout, it hits the userApi.js
// calls urls.py to talk to django admin 


const initialState = { isLoggedIn: false };

export const userApiSlice = createApi({
  reducerPath: 'users',
  initialState,
  baseQuery: fetchBaseQuery({ baseUrl: '/api/users' }),

  prepareHeaders: (headers, { getState }) => {
    // Django requires this for security (cross-site forgery protection) once logged in
    headers.set('X-CSRFToken', window.CSRF_TOKEN);
    return headers;
  },
  tagTypes: ['user'],

  endpoints: (builder) => ({
    // current user
    current: builder.query({
      query: () => 'current',
       transformResponse: res => ({ ...res, isLoggedIn: res.is_authenticated}),
      providesTags: ['user']
    }),

    // logout: builder.query({
    //   query: () => 'logout',
    //   transformResponse: res => { isLoggedIn : false },
    //   invalidatesTags: ['user']
    // }),

    // making a mutation

  })
})

export const selectCurrentUser = (state) => userApiSlice.endpoints.current.select()(state).data;

export const {
  useProfileQuery,
  useLogoutQuery,
} = userApiSlice;
