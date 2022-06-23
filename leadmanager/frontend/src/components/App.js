// React 
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'

// Router 
import { BrowserRouter, Routes, Route } from 'react-router-dom';


// Componenets
import Homepage from './layout/Homepage';
import Account from './layout/Account';

import Explorer from './pages/Explorer'
import SourceMananger from './pages/SourceManager'
import TopicMapper from './pages/TopicMapper'


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
                        <Route path="Explorer" element={<Explorer />} />
                        <Route path="TopicMapper" element={<TopicMapper />} />
                        <Route path="SourceManager" element={<SourceMananger />} />
                        <Route path="Account" element={<Account />} />
                    </Route>
                </Routes>
            </BrowserRouter >
        );
};
