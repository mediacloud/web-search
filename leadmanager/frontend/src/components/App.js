import React, { Component, Fragment } from 'react';
import { createRoot } from 'react-dom/client';

import Header from './layout/Header';
import Profiles from '../features/profiles/Profiles';

import ApiSlice from '../features/api/ApiSlice';

class App extends Component {
    render() {
        return (
            <Fragment>
                <Header />
                <Profiles />
            </Fragment>
        );

    }
}

createRoot(document.getElementById('app')).render(<App tab="home" />);



