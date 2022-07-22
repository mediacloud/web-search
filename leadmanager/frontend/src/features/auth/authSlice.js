import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'auth',
  initialState: { search: null, user: null, isLoggedIn: false },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload;
      state.isLoggedIn = state.user && state.user.isActive;
    },
    setSearch: (state, { payload }) => {
      state.search = payload;
    }
  },
});

export const setCredentials = slice.actions.setCredentials;

export const setSearch = slice.actions.setSearch

export const selectCurrentUser = (state) => state.auth.user;

export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;

export default slice.reducer;
