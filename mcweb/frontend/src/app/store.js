import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';

//rtk apis
import { api as authApi } from './services/authApi';
import { searchApi } from './services/searchApi';
import { managerApi } from './services/managerApi';

//reducers
import authReducer from '../features/auth/authSlice';
import searchReducer from '../features/search/searchSlice';
import uiReducer from '../features/ui/uiSlice';
import queryReducer from '../features/search/query/querySlice';
import resultsReducer from '../features/search/resultsSlice';

let store; // singleton store

// acts as a singleton factory method
export const getStore = () => {
  if (store === undefined) {
    store = setupStore();
  }
  return store;
};

const setupStore = () => {
  const theStore = configureStore({
    reducer: {
      // authentication api responsible for getting profile, logging out 
      // logging in, registering a user, resseting password 
      [authApi.reducerPath]: authApi.reducer,
      auth: authReducer,

      // search api responsible for totalAttention 
      [searchApi.reducerPath]: searchApi.reducer,
      search: searchReducer,

      // api responsible for all Sources or Collections CRUD
      [managerApi.reducerPath]: managerApi.reducer,

      ui: uiReducer,

      query: queryReducer,

      results: resultsReducer,

    },
    // Adding the api middleware enables caching, invalidation, polling,
    // and other useful features of `rtk-query`.
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware().concat(authApi.middleware, 
        searchApi.middleware,
        managerApi.middleware, 
        ),
    
  });
  // optional, but required for refetchOnFocus/refetchOnReconnect behaviors
  // see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
  setupListeners(theStore.dispatch);
  return theStore;
};