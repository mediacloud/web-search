import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';


import {
    BrowserRouter,
} from 'react-router-dom';

import { Link } from 'react-router-dom';


import { ApiProvider } from '@reduxjs/toolkit/query/react';
import { apiSlice } from '../features/api/apiSlice';



class App extends Component {
    render() {
        return (
            <div>
                <h1>Bookkeeper</h1>
                <nav style={{
                    borderBottom: "solid 1px",
                    paddingBottom: "1rem",
                }}>
                    <Link to="/invoices">Invoices</Link>|{" "}
                    <Link to="/expenses">Expenses</Link>
                </nav>
            </div>
        );



    }
}

createRoot(document.getElementById('app')).
    render(
        <BrowserRouter>
            <App />
        </BrowserRouter>);



