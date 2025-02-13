import renderApp from './Root';
import getStore from './app/store';
import { saveCsrfToken } from './services/csrfToken';

// gets the store from store.js
// dispatches the current query from userApi
// renders app from App.js (holds all the routing)

async function initializeApp() {
  getStore();
  saveCsrfToken();
  renderApp();
}

initializeApp();
