// React
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'
import { SnackbarProvider } from 'notistack';

// Router
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// MUI Styling
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';

// user status
import Account from './features/auth/Account'
import SignIn from './features/auth/SignIn'
import SignUp from './features/auth/SignUp';


// Componenets
import Homepage from './Homepage';

// pages
import Collections from './features/collections/Collections';
import Search from './features/search/Search'

import { selectIsLoggedIn } from './features/auth/authSlice';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';


const theme = createTheme();
// Store
import { getStore } from './app/store';


// commit

const App = () => (
  <Provider store={getStore()}>
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3} autoHideDuration={1500}>
        <Homepage />
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

            <Route path="collections" element={<Collections />} />
            <Route path="search" element={<Search />} />
            <Route path="sign-in" element={<SignIn />} />
            <Route path="sign-up" element={<SignUp />} />
            <Route path="account" element={<Account />} />
          </Route>
        </Routes>
      </BrowserRouter >
    );
};

function PrivateOutlet({ children }) {
  const auth = useSelector(selectIsLoggedIn);
  console.log(auth)
  return auth ? children : <Navigate to="/sign-in" />;
}
