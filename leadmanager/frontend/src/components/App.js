import React, { Component, Fragment } from 'react';
import { createRoot } from 'react-dom/client';


import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import { Outlet, Link } from 'react-router-dom';

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
