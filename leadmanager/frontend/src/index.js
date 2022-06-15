import { renderApp } from './components/App';
import { getStore } from './store';
import { userApiSlice } from './services/userApi';

//import { currentUserProfileAction } from './actions/user';
//import { useProfileQuery }
// First check if they are logged in already
// dispatch a Redux action that calls /server/login-with-cookie
// on server: check if a user is logged in, if so then return user object, if not then return 401
// if server returns user object, save it to store in a useful place and set a `isLoggedIn` on the store to true (it should default false)
// then call renderApp


//store.dispath(currentUserProfile()).then(() => renderApp());
//currentUserProfile is a redux


// const currentUserProfile = () => { return fetch(‘/auth/login-with-cookie’).then(res => res.json())}
//fetch(url, credentials:’include’)

const initializeApp = () => {
  const store = getStore();
  //store.dispatch(currentUserProfileAction());
  store.dispatch(
     userApiSlice.endpoints.current.initiate()
  ).then(() => renderApp());
}

initializeApp();
