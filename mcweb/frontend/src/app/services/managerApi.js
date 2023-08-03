import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const managerApi = createApi({
  reducerPath: 'managerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'api/directory/',
    prepareHeaders: (headers) => {
      // Django requires this for security (cross-site forgery protection) once logged in
      headers.set('X-Csrftoken', window.CSRF_TOKEN);
      return headers;
    },
  }),
  tagTypes: ['Source', 'Collection', 'Feed'],
  endpoints: () => ({}),
});

export default managerApi;
