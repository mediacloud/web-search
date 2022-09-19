// React
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';

// Router
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// MUI Styling
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';

// Import our style sheet
import '../../frontend/src/style/Application.scss';
// user status
import Account from './features/auth/Account';
import SignIn from './features/auth/SignIn';
import SignUp from './features/auth/SignUp';
import ResetPassword from './features/auth/ResetPassword';
import ConfirmedReset from './features/auth/ConfirmedReset';

// Components
import Homepage from './Homepage';

// pages
import Collections from './features/collections/CollectionShow';
import CollectionHome from './features/collections/CollectionHome';
import CreateCollection from './features/collections/CreateCollection';
import Search from './features/search/Search';
import SourceHome from './features/sources/SourceHome';
import SourceShow from './features/sources/SourceShow';

//modify pages
import ModifyCollection from './features/collections/ModifyCollection';
import ModifySource from './features/sources/ModifySource';

import { selectIsLoggedIn } from './features/auth/authSlice';
import { useSelector } from 'react-redux';
import { useLocation, Navigate } from 'react-router-dom';
const theme = createTheme();
// Store
import { getStore } from './app/store';


const App = () => (
  <Provider store={getStore()}>
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3} autoHideDuration={1500}>
        <Box>
          <Homepage />
        </Box>
      </SnackbarProvider>
    </ThemeProvider>
  </Provider >
);

export const renderApp = () => {
  createRoot(document.getElementById('app')).
    render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            
            <Route path="collections/:collectionId/modify-collection" element={
              <RequireAuth>
                <ModifyCollection />
              </RequireAuth>} />

            <Route path="collections/:collectionId" element={
              <RequireAuth>
                <Collections />
              </RequireAuth>}
            />

            <Route path="collections/create" element={
              <RequireAuth>
                <CreateCollection />
              </RequireAuth>}
            />

            <Route path="collections" element={
              <RequireAuth>
                <CollectionHome />
              </RequireAuth>}
            />

            <Route path="search" element={
              <RequireAuth>
                <Search />
              </RequireAuth>} />

            <Route path="sources/:sourceId/modify-source" element={
              <RequireAuth>
                <ModifySource />
              </RequireAuth>} />

            <Route path="sources/:sourceId" element={
              <RequireAuth>
                <SourceShow />
              </RequireAuth>} /> 

            <Route path="sources" element={
              <RequireAuth>
                <SourceHome />
              </RequireAuth>} /> 

            <Route path="sign-in" element={<SignIn />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="reset-password/confirmed" element={<ConfirmedReset />} />

            <Route path="sign-up" element={<SignUp />} />
            <Route path="account" element={
              <RequireAuth>
                <Account />
              </RequireAuth>} />
          </Route>

        </Routes>
      </BrowserRouter >
    );
};

function RequireAuth({ children }) {
  const auth = useSelector(selectIsLoggedIn);
  const location = useLocation();

  if (!auth) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }
  return children;
}


