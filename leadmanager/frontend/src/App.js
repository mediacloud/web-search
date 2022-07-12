// React
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'
import { SnackbarProvider } from 'notistack';

// Router
import { HashRouter, Routes, Route } from 'react-router-dom';

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
import Collection from './features/collections/Collection'
import Search from './features/search/Search'


const theme = createTheme();
// Store
import { getStore } from './app/store';

const App = () => (
  <Provider store={getStore()}>
    <ThemeProvider theme={theme}>
      <SnackbarProvider maxSnack={3}>
        <Homepage />
      </SnackbarProvider>  
    </ThemeProvider>
  </Provider >
);

export const renderApp = () => {
  createRoot(document.getElementById('app')).
    render(
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="collections" element={<Collection />} />
            <Route path="search" element={<Search />} />
            <Route path="sign-in" element={<SignIn />} />
            <Route path="sign-up" element={<SignUp />} />
            <Route path="account" element={<Account />} />
          </Route>
        </Routes>
      </HashRouter >
    );
};
