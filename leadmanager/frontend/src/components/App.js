import React, { Component, Fragment } from 'react';
import ReactDom from 'react-dom/client';

// Header is the navbar 
import Header from './layout/Header';

//  Dashboard: Alerts />, <Form />, <Leads />
import Dashboard from './leads/Dashboard';

import { Provider } from 'react-redux';
import store from '../store';





class App extends Component {
    render() {
        return (
            // Provider componenet makes the Redux store available to any 
            // nested componenet that needs to access the  Redux Store 
            <Provider store={store}>
                <Fragment>
                    <Header />
                    <Dashboard />
                </Fragment>
            </Provider>
        );
    }
}

// solved and upgraded 
const container = document.getElementById('app');
const root = ReactDOMClient.createRoot(container);
root.render(<App tab="home" />);
root.render(<App tab="profile" />);