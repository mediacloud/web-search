import React, { Component, Fragment } from 'react';
import * as ReactDOMClient from 'react-dom/client';

import { Provider as AlertProvider } from 'react-alert';
import AlertTemplate from 'react-alert-template-basic';

import Header from './layout/Header';
import Dashboard from './leads/Dashboard';
import Alerts from './layout/Alerts';

import { Provider } from 'react-redux';
import store from '../store';
import reactDom from 'react-dom';

// Alert Options 
const alertOptions = {
    timeout: 3000,
    position: 'top center'
}


class App extends Component {
    render() {
        return (
            <Provider store={store}>
                <AlertProvider template={AlertTemplate}
                    {...alertOptions}>
                    <Fragment>
                        <Header />
                        <Alerts />
                        <div className="container">
                            <Dashboard />
                        </div>
                    </Fragment>
                </AlertProvider>
            </Provider>
        )
    }
}

// solved and upgraded 
const container = document.getElementById('app');
const root = ReactDOMClient.createRoot(container);
root.render(<App tab="home" />);
root.render(<App tab="profile" />);


