import renderApp from './Root';
import getStore from './app/store';
import { api as authApi } from './app/services/authApi';
import { setCredentials } from './features/auth/authSlice';
import { saveCsrfToken } from './services/csrfToken';

// gets the store from store.js
// dispatches the current query from userApi
// renders app from App.js (holds all the routing)

async function initializeApp() {
  const store = getStore();
  saveCsrfToken();
  const response = await store.dispatch(authApi.endpoints.profile.initiate());
  await store.dispatch(setCredentials(response.data));
  renderApp();
}

initializeApp();
