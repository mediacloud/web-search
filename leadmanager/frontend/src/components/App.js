import React, { Component } from 'react';
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

import { ApiProvider } from '@reduxjs/toolkit/query/react';
import { leadsApi } from '../features/api/leads';




class App extends Component {
    render() {
        return (
            <ApiProvider api={leadsApi}>
                <Homepage />
            </ApiProvider >
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
