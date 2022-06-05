import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';
import { Fragment } from 'react';

class App extends Component {
    render() {
        return (
            <Fragment>
                <h1> hello </h1>
            </Fragment>
        );

    }
}

createRoot(document.getElementById('app')).render(<App tab="home" />);



