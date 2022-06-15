import React, { Component, Fragment } from 'react';
import { createRoot } from 'react-dom/client';
<<<<<<< HEAD
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux'
=======


import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

>>>>>>> 9309a066aeb15de4337e581541dce9c4854c8517
import { Outlet, Link } from 'react-router-dom';
import { ApiProvider } from '@reduxjs/toolkit/query/react';

<<<<<<< HEAD
import Header from './layout/Header';
import UserList from '../features/profiles/UserList';
import Homepage from './layout/Homepage';
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
                    <Route path="header" element={<Header />} />
                    <Route path="users" element={<UserList />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};
=======
import Expenses from '../routes/expenses';
import Invoices from '../routes/invoices';
import Invoice from '../routes/Invoice';

import Homepage from './layout/Homepage';
import UserList from '../features/profiles/UserList';
import CsrfToken from '../csrftoken';
import { ApiProvider } from '@reduxjs/toolkit/query/react';
import { leadsApi } from '../features/api/leads';
import { Test } from '../Test';



class App extends Component {
    render() {
        return (

                // <ApiProvider api={leadsApi}>
                //     <Homepage />
                // </ApiProvider >

                <Test />

        );
    }
}

export const renderApp = () => {
    createRoot(document.getElementById('app')).
        render(
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<App />}>
                        <Route path='userlist' element={<UserList />} />
                    </Route>
                </Routes>
            </BrowserRouter >
        );
}
>>>>>>> 9309a066aeb15de4337e581541dce9c4854c8517
