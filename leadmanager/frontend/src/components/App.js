import React, { Component, Fragment } from 'react';
import * as ReactDOMClient from 'react-dom/client';

import Header from './layout/Header';
import Dashboard from './leads/Dashboard';

import { Provider } from 'react-redux';
import store from '../store';
import reactDom from 'react-dom';


class App extends Component {
    render() {
        return (
            <Provider store = {store}>
                <Fragment>
                    <Header />
                    <div className="container">
                        <Dashboard />
                    </div>
                </Fragment>
            </Provider>
        )
    }
}

// solved and upgraded 
const container = document.getElementById('app');
const root = ReactDOMClient.createRoot(container);
root.render(<App tab="home" />);
root.render(<App tab="profile" />);


