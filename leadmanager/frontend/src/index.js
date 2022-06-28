import { renderApp } from './components/App';
import { getStore } from './store';
import { userApiSlice } from './services/userApi';

// gets the store from store.js 
// dispatches the current query from userApi
// renders app from App.js (holds all the routing)

const initializeApp = () => {
  const store = getStore();
  store.dispatch(
     userApiSlice.endpoints.current.initiate(),
  ).then(() => renderApp());
}

initializeApp();
