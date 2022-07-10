import { renderApp } from './App';
import { getStore } from './app/store';
import { api as authApi } from './app/services/authApi';
import { getCookie } from './services/CsrfToken';
import { setCredentials } from './features/auth/authSlice';

// gets the store from store.js
// dispatches the current query from userApi
// renders app from App.js (holds all the routing)

async function initializeApp() {
  const store = getStore();
  window.CSRF_TOKEN = getCookie('csrftoken');
  const response = await store.dispatch(authApi.endpoints.profile.initiate());
  await store.dispatch(setCredentials(response.data));
  renderApp();
}

initializeApp();
