import React, { Component, Fragment } from 'react';
import { createRoot } from 'react-dom/client';

import Header from './layout/Header';
import Profiles from '../features/profiles/Profiles';


class App extends Component {
    render() {
        return (
            <Fragment>
                <Header />
                <div>hello</div>
            </Fragment>
        );

    }
}

createRoot(document.getElementById('app')).render(<App tab="home" />);



