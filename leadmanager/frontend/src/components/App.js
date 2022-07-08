// React 
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'

// Router 
import { BrowserRouter, Routes, Route } from 'react-router-dom';


// Componenets
import Homepage from './layout/Homepage';


// user status 
import Account from './layout/Account'
import SignIn from './layout/SignIn'
import SignUp from './layout/SignUp';


// pages 
import Collection from './pages/Collection'
import Search from './pages/Search'


// MUI Styling 
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';

const theme = createTheme();
// Store 
import { getStore } from '../store';

const App = () => (
    <Provider store={getStore()}>

        <Homepage />

        {/* <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">

                
            </Container>
        </ThemeProvider> */}

    </Provider >
);

export const renderApp = () => {
    createRoot(document.getElementById('app')).
        render(
            <BrowserRouter>
                <Routes>
                    <Route exact path="/" element={<App />}>
                        <Route path="Collection" element={<Collection />} />
                        <Route path="Search" element={<Search />} />


                        <Route path="Sign-In" element={<SignIn />} />
                        <Route path="Sign-Up" element={<SignUp />} />


                        <Route path="Account" element={<Account />} />
                    </Route>
                </Routes>
            </BrowserRouter >
        );
};
