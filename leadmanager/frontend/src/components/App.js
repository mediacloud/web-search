import React, { Component, Fragment } from 'react';
import { createRoot } from 'react-dom/client';


import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';

import { Outlet, Link } from 'react-router-dom';

import Header from './layout/Header';
import UserList from '../features/profiles/UserList';
import Homepage from './layout/Homepage';

import { ApiProvider } from '@reduxjs/toolkit/query/react';
import { apiSlice } from '../features/api/apiSlice';



class App extends Component {
    render() {
        return (
            <ApiProvider api={apiSlice}>
               <Homepage />
            </ApiProvider >
        );



    }
}

createRoot(document.getElementById('app')).
    render(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route path="header" element={<Header />} />
                    <Route path="users" element={<UserList />} />
                </Route>
            </Routes>
        </BrowserRouter>);



