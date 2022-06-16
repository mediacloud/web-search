import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { userApiSlice } from './services/userApi';

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
      [userApiSlice.reducerPath]: userApiSlice.reducer,

    },
    // Adding the api middleware enables caching, invalidation, polling,
    // and other useful features of `rtk-query`.
    middleware: [
      ...getDefaultMiddleware(),
      userApiSlice.middleware,
    ],
  });
  // optional, but required for refetchOnFocus/refetchOnReconnect behaviors
  // see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
  setupListeners(theStore.dispatch);
  return theStore;
};
