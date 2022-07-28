import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { api as authApi } from './services/authApi';
import { searchApi } from './services/searchApi';

import authReducer from '../features/auth/authSlice';
import searchReducer from '../features/search/searchSlice';

let store; // singleton store

// acts as a singleton factory method
export const getStore = () => {
  if (store === undefined) {
    store = setupStore();
  }
  return store;
}

const setupStore = () => {
  const theStore = configureStore({
    reducer: {
      // Add the generated reducer as a specific top-level slice
      [authApi.reducerPath]: authApi.reducer,
      auth: authReducer,

      [searchApi.reducerPath]: searchApi.reducer,
      search: searchReducer,

    },
    // Adding the api middleware enables caching, invalidation, polling,
    // and other useful features of `rtk-query`.
    middleware: [
      ...getDefaultMiddleware(),
    ],
  });
  // optional, but required for refetchOnFocus/refetchOnReconnect behaviors
  // see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
  setupListeners(theStore.dispatch);
  return theStore;
};