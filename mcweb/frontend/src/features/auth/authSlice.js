import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'auth',
  initialState: { user: null, isLoggedIn: false },
  reducers: {
    setCredentials: (state, { payload }) => {
      console.log(payload);
      state.user = payload;
      state.isLoggedIn = state.user && state.user.isActive;
    },

  },
});

export const { setCredentials } = slice.actions;

export const selectCurrentUser = (state) => state.auth.user;

export const selectIsLoggedIn = (state) => state.auth.isLoggedIn;

export default slice.reducer;
