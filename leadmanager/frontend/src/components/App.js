import React, { Component, Fragment } from 'react';
import { createRoot } from 'react-dom/client';


import {
    BrowserRouter,
    Routes,
    Route,
} from 'react-router-dom';

import { Link } from 'react-router-dom';


import Header from './layout/Header';
import Profiles from '../features/profiles/Profiles';


import { ApiProvider } from '@reduxjs/toolkit/query/react';
import { apiSlice } from '../features/api/apiSlice';



class App extends Component {
    render() {
        return (
            <ApiProvider api={apiSlice}>
                <Fragment>
                    <Header />
                    <Profiles />

                </Fragment>

                <Link to="/header">Header</Link>
                <Link to="/profiles">Profiles</Link >


            </ApiProvider >
        );



        /*
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route path="admin" element={<AdminHome />}>
                        <Route path="users" element={<UserList />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
        */

    }
}

createRoot(document.getElementById('app')).
    render(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route path="header" element={<Header />} />
                    <Route path="users" element={<Profiles />} />
                </Route>
            </Routes>
        </BrowserRouter>);



