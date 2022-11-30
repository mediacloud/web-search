import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const managerApi = createApi({
  reducerPath: 'managerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/sources/',
    prepareHeaders: (headers) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),
  tagTypes: ['Source', 'Collection'],
  endpoints: () => ({}),
});

export default managerApi;
