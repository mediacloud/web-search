import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { leadsApi } from './features/api/leads';
import Test from './Test';

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [leadsApi.reducerPath]: leadsApi.reducer,


    // [Test.reducerPath]: Test.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(leadsApi.middleware),

})

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch)
