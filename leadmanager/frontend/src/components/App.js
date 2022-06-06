import React, { Component, Fragment } from 'react';
import { createRoot } from 'react-dom/client';

import Header from './layout/Header';
import Profiles from '../features/profiles/Profiles';


import { ApiProvider } from '@reduxjs/toolkit/query/react';
import { apiSlice } from '../features/api/apiSlice';



class App extends Component {
    render() {
        return (
            <ApiProvider api= {apiSlice}>
                <Fragment>
                    <Header />
                    <Profiles />
                </Fragment>
            </ApiProvider>

        );

    }
}

createRoot(document.getElementById('app')).render(<App tab="home" />);



