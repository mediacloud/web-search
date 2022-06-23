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
import Login from './layout/Login'
import SignUp from './SignUp';

// pages 
import Explorer from './pages/Explorer'
import SourceMananger from './pages/SourceManager'
import TopicMapper from './pages/TopicMapper'



// MUI Styling 
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Container from '@mui/material/Container';

const theme = createTheme();
// Store 
import { getStore } from '../store';

const App = () => (
    <Provider store={getStore()}>

        {/* <Homepage /> */}

        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">

                <SignUp />
                
            </Container>
        </ThemeProvider>

    </Provider >
);

export const renderApp = () => {
    createRoot(document.getElementById('app')).
        render(
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App />}>
                        <Route path="Explorer" element={<Explorer />} />
                        <Route path="TopicMapper" element={<TopicMapper />} />
                        <Route path="SourceManager" element={<SourceMananger />} />

                        <Route path="Login" element={<Login />} />
                        <Route path="Account" element={<Account />} />
                    </Route>
                </Routes>
            </BrowserRouter >
        );
};
