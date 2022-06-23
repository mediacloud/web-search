// React 
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'

// Router 
import { BrowserRouter, Routes, Route } from 'react-router-dom';


// Componenets
import Header from './layout/Header';
import Homepage from './layout/Homepage';
import Account from './layout/Account';

// Store 
import { getStore } from '../store';

const App = () => (
    <Provider store={getStore()}>
        <Homepage />
    </Provider >
);

export const renderApp = () => {
    createRoot(document.getElementById('app')).
        render(
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<App />}>
                            <Route path = "/Account" element= {<Account />} />
                    </Route>
                </Routes>
            </BrowserRouter >
        );
};
